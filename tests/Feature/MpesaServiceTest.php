<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Payment;
use App\Services\Payments\MpesaService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MpesaServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_phone_number_formatting(): void
    {
        $service = new MpesaService;

        $this->assertEquals('254712345678', $service->formatPhoneNumber('0712345678'));
        $this->assertEquals('254712345678', $service->formatPhoneNumber('254712345678'));
        $this->assertEquals('254112345678', $service->formatPhoneNumber('0112345678'));
    }

    public function test_stk_push_initiates_payment_record(): void
    {
        $order = Order::create([
            'order_number' => 'NY-TEST-101',
            'customer_name' => 'John Doe',
            'customer_phone' => '0712345678',
            'total_amount' => 1200.00,
            'deposit_amount' => 1200.00,
            'balance_amount' => 1200.00,
            'payment_status' => 'UNPAID',
        ]);

        $service = new MpesaService;
        $payment = $service->initiatePayment($order, 1200.00, [
            'phone_number' => '0712345678',
        ]);

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'order_id' => $order->id,
            'amount' => 1200.00,
            'payment_method' => 'mpesa',
            'phone_number' => '254712345678',
        ]);

        $this->assertNotNull($payment->checkout_request_id);
    }

    public function test_callback_updates_payment_and_order_status(): void
    {
        $order = Order::create([
            'order_number' => 'NY-TEST-102',
            'customer_name' => 'Jane Smith',
            'customer_phone' => '0722000000',
            'total_amount' => 1500.00,
            'paid_amount' => 0.00,
            'balance_amount' => 1500.00,
            'payment_status' => 'UNPAID',
        ]);

        $payment = Payment::create([
            'order_id' => $order->id,
            'payment_method' => 'mpesa',
            'amount' => 1500.00,
            'currency' => 'KES',
            'status' => 'PROCESSING',
            'phone_number' => '254722000000',
            'checkout_request_id' => 'ws_CO_TEST_12345',
            'merchant_request_id' => 'MR_TEST_12345',
        ]);

        $callbackPayload = [
            'Body' => [
                'stkCallback' => [
                    'MerchantRequestID' => 'MR_TEST_12345',
                    'CheckoutRequestID' => 'ws_CO_TEST_12345',
                    'ResultCode' => 0,
                    'ResultDesc' => 'The service request is processed successfully.',
                    'CallbackMetadata' => [
                        'Item' => [
                            ['Name' => 'Amount', 'Value' => 1500.00],
                            ['Name' => 'MpesaReceiptNumber', 'Value' => 'NLJ7RT61KV'],
                            ['Name' => 'TransactionDate', 'Value' => 20260921223000],
                            ['Name' => 'PhoneNumber', 'Value' => 254722000000],
                        ],
                    ],
                ],
            ],
        ];

        $service = new MpesaService;
        $updatedPayment = $service->handleCallback($callbackPayload);

        $this->assertEquals('PAID', $updatedPayment->status);
        $this->assertEquals('NLJ7RT61KV', $updatedPayment->mpesa_receipt_number);

        $order->refresh();
        $this->assertEquals('PAID', $order->payment_status);
        $this->assertEquals(1500.00, (float) $order->paid_amount);
        $this->assertEquals(0.00, (float) $order->balance_amount);
    }
}
