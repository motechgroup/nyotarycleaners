<?php

use App\Http\Controllers\Api\AdminPaymentController;
use App\Http\Controllers\Api\MpesaController;
use App\Http\Controllers\Api\OrderController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Customer Booking & Services
    Route::get('/services', [OrderController::class, 'services']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);

    // M-Pesa STK Push Payments
    Route::post('/payments/mpesa/stk-push', [MpesaController::class, 'stkPush']);
    Route::post('/payments/mpesa/callback', [MpesaController::class, 'callback']);
    Route::get('/payments/status/{checkoutRequestId}', [MpesaController::class, 'status']);

    // Admin ERP Dashboard & Payments Management
    Route::get('/admin/dashboard-stats', [AdminPaymentController::class, 'dashboardStats']);
    Route::get('/admin/payments', [AdminPaymentController::class, 'payments']);
    Route::get('/admin/reconciliation', [AdminPaymentController::class, 'reconciliation']);
    Route::post('/admin/settings', [AdminPaymentController::class, 'updateSettings']);
});
