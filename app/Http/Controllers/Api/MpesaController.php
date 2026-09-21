<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Services\Payments\PaymentService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MpesaController extends Controller
{
    public function __construct(protected PaymentService $paymentService) {}

    /**
     * Initiate M-Pesa STK Push.
     * POST /api/v1/payments/mpesa/stk-push
     */
    public function stkPush(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'phone_number' => 'required|string|min:9|max:15',
            'amount' => 'nullable|numeric|min:1',
        ]);

        $order = Order::findOrFail($validated['order_id']);

        // Determine amount to charge
        $amountToCharge = ! empty($validated['amount'])
            ? (float) $validated['amount']
            : ($order->deposit_amount > 0 && $order->paid_amount == 0 ? $order->deposit_amount : $order->balance_amount);

        if ($amountToCharge <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'This order is already fully paid.',
            ], 400);
        }

        try {
            $payment = $this->paymentService->processPayment($order, 'mpesa', $amountToCharge, [
                'phone_number' => $validated['phone_number'],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Check your phone for the M-Pesa payment prompt.',
                'checkout_request_id' => $payment->checkout_request_id,
                'payment' => [
                    'id' => $payment->id,
                    'order_id' => $payment->order_id,
                    'amount' => $payment->amount,
                    'status' => $payment->status,
                    'phone_number' => $payment->phone_number,
                    'checkout_request_id' => $payment->checkout_request_id,
                    'result_description' => $payment->result_description,
                ],
            ]);
        } catch (Exception $e) {
            Log::error('STK Push Controller Exception', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to initiate M-Pesa STK Push: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Public M-Pesa Callback Endpoint.
     * POST /api/v1/payments/mpesa/callback
     */
    public function callback(Request $request): JsonResponse
    {
        Log::info('M-Pesa Callback Raw Payload', ['payload' => $request->all()]);

        try {
            $payment = $this->paymentService->handleMpesaCallback($request->all());

            return response()->json([
                'ResultCode' => 0,
                'ResultDesc' => 'Accepted',
            ]);
        } catch (Exception $e) {
            Log::error('M-Pesa Callback Processing Error', [
                'error' => $e->getMessage(),
                'payload' => $request->all(),
            ]);

            return response()->json([
                'ResultCode' => 1,
                'ResultDesc' => 'Error: '.$e->getMessage(),
            ], 400);
        }
    }

    /**
     * Check STK Push status by checkout_request_id.
     * GET /api/v1/payments/status/{checkoutRequestId}
     */
    public function status(Request $request, string $checkoutRequestId): JsonResponse
    {
        $payment = Payment::where('checkout_request_id', $checkoutRequestId)->first();

        if (! $payment) {
            return response()->json([
                'success' => false,
                'message' => 'Payment transaction not found for provided checkout request ID.',
            ], 404);
        }

        // Sandbox test simulation trigger
        if ($request->has('simulate_success') && env('MPESA_ENVIRONMENT', 'sandbox') === 'sandbox' && $payment->status !== 'PAID') {
            $payment->update([
                'status' => 'PAID',
                'mpesa_receipt_number' => 'NLJ'.strtoupper(substr(md5(time()), 0, 7)),
                'transaction_date' => now(),
                'result_code' => '0',
                'result_description' => 'Simulated successful M-Pesa transaction (Sandbox)',
            ]);
            $payment->order->recalculatePaymentStatus();
        } elseif ($payment->status === 'PROCESSING') {
            $this->paymentService->checkPaymentStatus($payment);
        }

        $payment->refresh();
        $order = $payment->order->fresh();

        return response()->json([
            'success' => true,
            'payment' => [
                'id' => $payment->id,
                'status' => $payment->status,
                'amount' => $payment->amount,
                'mpesa_receipt_number' => $payment->mpesa_receipt_number,
                'result_code' => $payment->result_code,
                'result_description' => $payment->result_description,
                'updated_at' => $payment->updated_at->toIso8601String(),
            ],
            'order' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'total_amount' => $order->total_amount,
                'paid_amount' => $order->paid_amount,
                'balance_amount' => $order->balance_amount,
                'payment_status' => $order->payment_status,
            ],
        ]);
    }
}
