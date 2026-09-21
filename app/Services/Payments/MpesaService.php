<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Models\Payment;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MpesaService implements PaymentServiceInterface
{
    protected string $environment;

    protected string $consumerKey;

    protected string $consumerSecret;

    protected string $shortcode;

    protected string $passkey;

    protected string $callbackUrl;

    protected string $transactionType;

    protected string $accountReference;

    protected string $transactionDesc;

    protected string $baseUrl;

    public function __construct()
    {
        $this->environment = config('services.mpesa.environment', env('MPESA_ENVIRONMENT', 'sandbox'));
        $this->consumerKey = config('services.mpesa.consumer_key', env('MPESA_CONSUMER_KEY', ''));
        $this->consumerSecret = config('services.mpesa.consumer_secret', env('MPESA_CONSUMER_SECRET', ''));
        $this->shortcode = config('services.mpesa.shortcode', env('MPESA_SHORTCODE', '174379'));
        $this->passkey = config('services.mpesa.passkey', env('MPESA_PASSKEY', 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919'));
        $this->callbackUrl = config('services.mpesa.callback_url', env('MPESA_CALLBACK_URL', 'http://localhost:8000/api/v1/payments/mpesa/callback'));
        $this->transactionType = config('services.mpesa.transaction_type', env('MPESA_TRANSACTION_TYPE', 'CustomerPayBillOnline'));
        $this->accountReference = config('services.mpesa.account_reference', env('MPESA_ACCOUNT_REFERENCE', 'NYOTA'));
        $this->transactionDesc = config('services.mpesa.transaction_desc', env('MPESA_TRANSACTION_DESC', 'Nyota Laundry Payment'));

        $this->baseUrl = strtolower($this->environment) === 'production' || strtolower($this->environment) === 'live'
            ? 'https://api.safaricom.co.ke'
            : 'https://sandbox.safaricom.co.ke';
    }

    /**
     * Get OAuth Access Token from Safaricom Daraja API.
     */
    public function getAccessToken(): string
    {
        return Cache::remember('mpesa_access_token', 3500, function () {
            if (empty($this->consumerKey) || empty($this->consumerSecret)) {
                // Return dummy token in sandbox test environment if keys not present
                if (strtolower($this->environment) === 'sandbox') {
                    return 'sandbox_access_token_token_placeholder';
                }
                throw new Exception('M-Pesa Consumer Key or Consumer Secret missing in .env configuration.');
            }

            $url = $this->baseUrl.'/oauth/v1/generate?grant_type=client_credentials';

            $response = Http::withBasicAuth($this->consumerKey, $this->consumerSecret)
                ->acceptJson()
                ->get($url);

            if ($response->successful() && isset($response->json()['access_token'])) {
                return $response->json()['access_token'];
            }

            Log::error('M-Pesa Access Token Request Failed', [
                'status' => $response->status(),
                'response' => $response->body(),
            ]);

            throw new Exception('Failed to obtain M-Pesa Access Token from Safaricom: '.$response->body());
        });
    }

    /**
     * Format phone number to standard 254XXXXXXXXX format.
     */
    public function formatPhoneNumber(string $phone): string
    {
        $cleaned = preg_replace('/[^0-9]/', '', $phone);

        if (str_starts_with($cleaned, '0')) {
            return '254'.substr($cleaned, 1);
        }

        if (str_starts_with($cleaned, '7') || str_starts_with($cleaned, '1')) {
            return '254'.$cleaned;
        }

        if (str_starts_with($cleaned, '254')) {
            return $cleaned;
        }

        return $cleaned;
    }

    /**
     * Initiate M-Pesa STK Push request.
     */
    public function initiatePayment(Order $order, float $amount, array $payload = []): Payment
    {
        $rawPhone = $payload['phone_number'] ?? $order->customer_phone;
        $phoneNumber = $this->formatPhoneNumber($rawPhone);
        $timestamp = date('YmdHis');
        $password = base64_encode($this->shortcode.$this->passkey.$timestamp);

        $payment = Payment::create([
            'order_id' => $order->id,
            'customer_id' => null,
            'payment_method' => 'mpesa',
            'amount' => $amount,
            'currency' => 'KES',
            'status' => 'PENDING',
            'phone_number' => $phoneNumber,
            'reference' => $order->order_number,
            'metadata' => [
                'timestamp' => $timestamp,
                'account_reference' => $this->accountReference,
            ],
        ]);

        $stkPayload = [
            'BusinessShortCode' => $this->shortcode,
            'Password' => $password,
            'Timestamp' => $timestamp,
            'TransactionType' => $this->transactionType,
            'Amount' => (int) round($amount),
            'PartyA' => $phoneNumber,
            'PartyB' => $this->shortcode,
            'PhoneNumber' => $phoneNumber,
            'CallBackURL' => $this->callbackUrl,
            'AccountReference' => $order->order_number,
            'TransactionDesc' => substr($this->transactionDesc, 0, 12),
        ];

        try {
            $accessToken = $this->getAccessToken();
            $url = $this->baseUrl.'/mpesa/stkpush/v1/processrequest';

            $response = Http::withToken($accessToken)
                ->acceptJson()
                ->post($url, $stkPayload);

            $responseData = $response->json() ?? [];

            Log::info('M-Pesa STK Push Response Received', [
                'payment_id' => $payment->id,
                'order_number' => $order->order_number,
                'response_code' => $responseData['ResponseCode'] ?? null,
                'customer_phone' => substr($phoneNumber, 0, 6).'****'.substr($phoneNumber, -2),
            ]);

            if ($response->successful() && isset($responseData['ResponseCode']) && $responseData['ResponseCode'] === '0') {
                $payment->update([
                    'status' => 'PROCESSING',
                    'merchant_request_id' => $responseData['MerchantRequestID'] ?? null,
                    'checkout_request_id' => $responseData['CheckoutRequestID'] ?? null,
                    'result_code' => $responseData['ResponseCode'],
                    'result_description' => $responseData['ResponseDescription'] ?? 'STK Push sent successfully',
                    'metadata' => array_merge($payment->metadata ?? [], [
                        'customer_message' => $responseData['CustomerMessage'] ?? 'STK Push sent',
                    ]),
                ]);
            } else {
                // Check if sandbox mock mode for offline testing
                if (strtolower($this->environment) === 'sandbox' && (empty($this->consumerKey) || str_contains($accessToken, 'sandbox_access_token'))) {
                    $mockCheckoutId = 'ws_CO_'.date('YmdHis').'_'.rand(1000, 9999);
                    $payment->update([
                        'status' => 'PROCESSING',
                        'merchant_request_id' => 'MOCK_MERCHANT_'.rand(100, 999),
                        'checkout_request_id' => $mockCheckoutId,
                        'result_code' => '0',
                        'result_description' => 'Sandbox STK Push prompt initiated.',
                        'metadata' => array_merge($payment->metadata ?? [], [
                            'is_sandbox_simulation' => true,
                            'customer_message' => 'Check your phone for the M-Pesa payment prompt.',
                        ]),
                    ]);
                } else {
                    $payment->update([
                        'status' => 'FAILED',
                        'result_code' => $responseData['ResponseCode'] ?? 'ERROR',
                        'result_description' => $responseData['ResponseDescription'] ?? $responseData['errorMessage'] ?? 'STK Push initiation failed',
                    ]);
                }
            }
        } catch (Exception $e) {
            Log::error('M-Pesa STK Push Exception', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);

            // If sandbox mode, handle gracefully
            if (strtolower($this->environment) === 'sandbox') {
                $mockCheckoutId = 'ws_CO_'.date('YmdHis').'_'.rand(1000, 9999);
                $payment->update([
                    'status' => 'PROCESSING',
                    'merchant_request_id' => 'MOCK_MERCHANT_'.rand(100, 999),
                    'checkout_request_id' => $mockCheckoutId,
                    'result_code' => '0',
                    'result_description' => 'Sandbox STK Push prompt initiated.',
                    'metadata' => array_merge($payment->metadata ?? [], [
                        'is_sandbox_simulation' => true,
                        'customer_message' => 'Check your phone for the M-Pesa payment prompt.',
                    ]),
                ]);
            } else {
                $payment->update([
                    'status' => 'FAILED',
                    'result_code' => 'EXCEPTION',
                    'result_description' => $e->getMessage(),
                ]);
            }
        }

        return $payment;
    }

    /**
     * Process Callback from Safaricom.
     */
    public function handleCallback(array $callbackData): Payment
    {
        $stkCallback = $callbackData['Body']['stkCallback'] ?? [];
        $merchantRequestId = $stkCallback['MerchantRequestID'] ?? null;
        $checkoutRequestId = $stkCallback['CheckoutRequestID'] ?? null;
        $resultCode = (string) ($stkCallback['ResultCode'] ?? '');
        $resultDesc = $stkCallback['ResultDesc'] ?? '';

        Log::info('M-Pesa Callback Received', [
            'merchant_request_id' => $merchantRequestId,
            'checkout_request_id' => $checkoutRequestId,
            'result_code' => $resultCode,
            'result_desc' => $resultDesc,
        ]);

        $payment = Payment::where('checkout_request_id', $checkoutRequestId)
            ->orWhere('merchant_request_id', $merchantRequestId)
            ->first();

        if (! $payment) {
            Log::warning('M-Pesa Callback: Matching payment not found', [
                'checkout_request_id' => $checkoutRequestId,
            ]);
            throw new Exception('Matching payment transaction not found for checkout request ID: '.$checkoutRequestId);
        }

        // Prevent duplicate callback processing
        if ($payment->status === 'PAID') {
            Log::info('M-Pesa Callback: Payment already marked as PAID', ['payment_id' => $payment->id]);

            return $payment;
        }

        $items = $stkCallback['CallbackMetadata']['Item'] ?? [];
        $mpesaReceipt = null;
        $transactionDate = null;

        foreach ($items as $item) {
            if (($item['Name'] ?? '') === 'MpesaReceiptNumber') {
                $mpesaReceipt = $item['Value'] ?? null;
            }
            if (($item['Name'] ?? '') === 'TransactionDate') {
                $rawDate = (string) ($item['Value'] ?? '');
                if (strlen($rawDate) === 14) {
                    $transactionDate = Carbon::createFromFormat('YmdHis', $rawDate);
                }
            }
        }

        if ($resultCode === '0') {
            $payment->update([
                'status' => 'PAID',
                'mpesa_receipt_number' => $mpesaReceipt,
                'transaction_date' => $transactionDate ?? now(),
                'result_code' => $resultCode,
                'result_description' => $resultDesc,
            ]);

            // Update order payment status
            $payment->order->recalculatePaymentStatus();
        } else {
            $payment->update([
                'status' => 'FAILED',
                'result_code' => $resultCode,
                'result_description' => $resultDesc,
            ]);
        }

        return $payment;
    }

    /**
     * Query status of an STK Push payment from Safaricom Daraja API.
     */
    public function queryStatus(Payment $payment): array
    {
        if (empty($payment->checkout_request_id)) {
            return [
                'status' => $payment->status,
                'message' => 'No CheckoutRequestID recorded for payment.',
            ];
        }

        // If sandbox simulation mode, check if auto-complete is set or return status
        if (! empty($payment->metadata['is_sandbox_simulation'])) {
            return [
                'status' => $payment->status,
                'result_code' => $payment->result_code,
                'result_desc' => $payment->result_description,
                'mpesa_receipt_number' => $payment->mpesa_receipt_number,
            ];
        }

        try {
            $accessToken = $this->getAccessToken();
            $timestamp = date('YmdHis');
            $password = base64_encode($this->shortcode.$this->passkey.$timestamp);

            $queryUrl = $this->baseUrl.'/mpesa/stkpushquery/v1/query';

            $response = Http::withToken($accessToken)
                ->acceptJson()
                ->post($queryUrl, [
                    'BusinessShortCode' => $this->shortcode,
                    'Password' => $password,
                    'Timestamp' => $timestamp,
                    'CheckoutRequestID' => $payment->checkout_request_id,
                ]);

            $data = $response->json() ?? [];

            if ($response->successful() && isset($data['ResultCode'])) {
                $resultCode = (string) $data['ResultCode'];
                if ($resultCode === '0') {
                    $payment->update([
                        'status' => 'PAID',
                        'result_code' => $resultCode,
                        'result_description' => $data['ResultDesc'] ?? 'Transaction completed successfully.',
                    ]);
                    $payment->order->recalculatePaymentStatus();
                } elseif ($resultCode !== '0' && ! in_array($payment->status, ['PAID'])) {
                    $payment->update([
                        'status' => 'FAILED',
                        'result_code' => $resultCode,
                        'result_description' => $data['ResultDesc'] ?? 'Transaction failed or cancelled.',
                    ]);
                }
            }

            return [
                'status' => $payment->status,
                'result_code' => $data['ResultCode'] ?? $payment->result_code,
                'result_desc' => $data['ResultDesc'] ?? $payment->result_description,
            ];
        } catch (Exception $e) {
            Log::error('M-Pesa STK Query Exception', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'status' => $payment->status,
                'error' => $e->getMessage(),
            ];
        }
    }
}
