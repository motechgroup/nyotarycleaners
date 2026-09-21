<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Models\Payment;
use Exception;

class CashService implements PaymentServiceInterface
{
    public function initiatePayment(Order $order, float $amount, array $payload = []): Payment
    {
        $isCollectedImmediately = $payload['collected'] ?? false;
        $status = $isCollectedImmediately ? 'PAID' : 'PENDING';

        $payment = Payment::create([
            'order_id' => $order->id,
            'payment_method' => 'cash',
            'amount' => $amount,
            'currency' => 'KES',
            'status' => $status,
            'phone_number' => $order->customer_phone,
            'reference' => 'CASH-'.$order->order_number,
            'transaction_date' => $isCollectedImmediately ? now() : null,
            'result_code' => '0',
            'result_description' => $isCollectedImmediately ? 'Cash payment collected.' : 'Pay on Delivery / Collection selected.',
        ]);

        if ($isCollectedImmediately) {
            $order->recalculatePaymentStatus();
        }

        return $payment;
    }

    public function handleCallback(array $callbackData): Payment
    {
        throw new Exception('Cash payments do not support external API callbacks.');
    }

    public function queryStatus(Payment $payment): array
    {
        return [
            'status' => $payment->status,
            'payment_method' => 'cash',
        ];
    }
}
