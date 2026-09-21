<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class PaymentService
{
    protected MpesaService $mpesaService;

    protected CashService $cashService;

    public function __construct(MpesaService $mpesaService, CashService $cashService)
    {
        $this->mpesaService = $mpesaService;
        $this->cashService = $cashService;
    }

    /**
     * Get appropriate service implementation for payment method.
     */
    public function getGateway(string $method): PaymentServiceInterface
    {
        return match (strtolower($method)) {
            'mpesa' => $this->mpesaService,
            'cash' => $this->cashService,
            default => throw new InvalidArgumentException("Unsupported payment method: {$method}"),
        };
    }

    /**
     * Initiate payment for an order within a DB transaction.
     */
    public function processPayment(Order $order, string $method, float $amount, array $payload = []): Payment
    {
        return DB::transaction(function () use ($order, $method, $amount, $payload) {
            $gateway = $this->getGateway($method);

            return $gateway->initiatePayment($order, $amount, $payload);
        });
    }

    /**
     * Handle incoming M-Pesa Callback.
     */
    public function handleMpesaCallback(array $callbackData): Payment
    {
        return DB::transaction(function () use ($callbackData) {
            return $this->mpesaService->handleCallback($callbackData);
        });
    }

    /**
     * Query status of a payment.
     */
    public function checkPaymentStatus(Payment $payment): array
    {
        $gateway = $this->getGateway($payment->payment_method);

        return $gateway->queryStatus($payment);
    }
}
