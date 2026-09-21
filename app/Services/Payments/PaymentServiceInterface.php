<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Models\Payment;

interface PaymentServiceInterface
{
    /**
     * Initiate a payment transaction for an order.
     *
     * @param  array  $payload  Additional payment details e.g. phone_number
     */
    public function initiatePayment(Order $order, float $amount, array $payload = []): Payment;

    /**
     * Process asynchronous payment callback/response.
     */
    public function handleCallback(array $callbackData): Payment;

    /**
     * Query the status of an ongoing transaction.
     */
    public function queryStatus(Payment $payment): array;
}
