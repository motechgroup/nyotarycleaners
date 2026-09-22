<?php

use App\Http\Controllers\Api\AdminPaymentController;
use App\Http\Controllers\Api\AdminServiceController;
use App\Http\Controllers\Api\MpesaController;
use App\Http\Controllers\Api\OrderController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Customer Booking & Services
    Route::get('/services', [OrderController::class, 'services']);
    Route::get('/customers/history', [OrderController::class, 'customerHistory']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);

    // M-Pesa STK Push Payments
    Route::post('/payments/mpesa/stk-push', [MpesaController::class, 'stkPush']);
    Route::post('/payments/mpesa/callback', [MpesaController::class, 'callback']);
    Route::get('/payments/status/{checkoutRequestId}', [MpesaController::class, 'status']);

    // Admin ERP Dashboard & Payments Management
    Route::get('/admin/dashboard-stats', [AdminPaymentController::class, 'dashboardStats']);
    Route::get('/admin/payments', [AdminPaymentController::class, 'payments']);
    Route::get('/admin/orders', [AdminPaymentController::class, 'orders']);
    Route::patch('/admin/orders/{id}/status', [AdminPaymentController::class, 'updateOrderStatus']);
    Route::get('/admin/reconciliation', [AdminPaymentController::class, 'reconciliation']);
    Route::get('/admin/settings', [AdminPaymentController::class, 'getSettings']);
    Route::post('/admin/settings', [AdminPaymentController::class, 'updateSettings']);

    // Admin ERP Service & Price Management
    Route::get('/admin/services', [AdminServiceController::class, 'index']);
    Route::post('/admin/services', [AdminServiceController::class, 'store']);
    Route::put('/admin/services/{id}', [AdminServiceController::class, 'update']);
    Route::patch('/admin/services/{id}/toggle-status', [AdminServiceController::class, 'toggleStatus']);
    Route::delete('/admin/services/{id}', [AdminServiceController::class, 'destroy']);
});
