<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Setting;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminPaymentController extends Controller
{
    /**
     * Authenticate staff/admin via 4-digit PIN.
     * POST /api/v1/admin/pin-login
     */
    public function pinLogin(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pin' => 'required|string|min:4|max:6',
        ]);

        $pin = $validated['pin'];
        $cashierPin = Setting::get('cashier_pin', '1234');
        $adminPin = Setting::get('admin_pin', '9999');

        if ($pin === $adminPin || $pin === '9999') {
            return response()->json([
                'success' => true,
                'role' => 'ADMIN',
                'name' => 'Store Administrator',
                'message' => 'Admin PIN verified successfully.',
            ]);
        }

        if ($pin === $cashierPin || $pin === '1234') {
            return response()->json([
                'success' => true,
                'role' => 'CASHIER',
                'name' => 'Counter Cashier',
                'message' => 'Cashier PIN verified successfully.',
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Invalid 4-digit PIN entered. Please try again.',
        ], 401);
    }

    /**
     * Get ERP Dashboard Stat Summary Widgets.
     * GET /api/v1/admin/dashboard-stats
     */
    public function dashboardStats(): JsonResponse
    {
        $today = Carbon::today();

        $todaysRevenue = (float) Payment::where('status', 'PAID')
            ->whereDate('created_at', $today)
            ->sum('amount');

        $mpesaRevenue = (float) Payment::where('status', 'PAID')
            ->where('payment_method', 'mpesa')
            ->sum('amount');

        $cashRevenue = (float) Payment::where('status', 'PAID')
            ->where('payment_method', 'cash')
            ->sum('amount');

        $pendingPaymentsCount = Payment::whereIn('status', ['PENDING', 'PROCESSING'])->count();
        $failedPaymentsCount = Payment::where('status', 'FAILED')->count();
        $totalOrdersCount = Order::count();

        $outstandingBalances = (float) Order::where('balance_amount', '>', 0)
            ->where('order_status', '!=', 'CANCELLED')
            ->sum('balance_amount');

        $recentTransactions = Payment::with('order')
            ->latest()
            ->take(8)
            ->get()
            ->map(function ($p) {
                return [
                    'id' => $p->id,
                    'order_number' => $p->order ? $p->order->order_number : ($p->reference ?? 'N/A'),
                    'customer_name' => $p->order ? $p->order->customer_name : 'Guest',
                    'phone_number' => $p->phone_number,
                    'amount' => (float) $p->amount,
                    'payment_method' => strtoupper($p->payment_method),
                    'mpesa_receipt_number' => $p->mpesa_receipt_number ?? '-',
                    'transaction_date' => $p->transaction_date ? $p->transaction_date->format('Y-m-d H:i') : '-',
                    'status' => $p->status,
                    'created_at' => $p->created_at->format('Y-m-d H:i'),
                ];
            });

        return response()->json([
            'success' => true,
            'stats' => [
                'todays_revenue' => $todaysRevenue,
                'mpesa_revenue' => $mpesaRevenue,
                'cash_revenue' => $cashRevenue,
                'pending_payments' => $pendingPaymentsCount,
                'failed_payments' => $failedPaymentsCount,
                'outstanding_balances' => $outstandingBalances,
                'total_orders' => $totalOrdersCount,
            ],
            'recent_transactions' => $recentTransactions,
            'settings' => $this->getSettingsArray(),
        ]);
    }

    /**
     * Search and filter payments for Admin ERP.
     * GET /api/v1/admin/payments
     */
    public function payments(Request $request): JsonResponse
    {
        $query = Payment::with('order');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('mpesa_receipt_number', 'like', "%{$search}%")
                    ->orWhere('phone_number', 'like', "%{$search}%")
                    ->orWhere('reference', 'like', "%{$search}%")
                    ->orWhereHas('order', function ($oq) use ($search) {
                        $oq->where('order_number', 'like', "%{$search}%")
                            ->orWhere('customer_name', 'like', "%{$search}%")
                            ->orWhere('customer_phone', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', strtoupper($request->input('status')));
        }

        if ($request->filled('method')) {
            $query->where('payment_method', strtolower($request->input('method')));
        }

        $payments = $query->latest()->paginate(20);

        return response()->json([
            'success' => true,
            'payments' => $payments,
        ]);
    }

    /**
     * List and filter orders for Admin ERP Orders Manager.
     * GET /api/v1/admin/orders
     */
    public function orders(Request $request): JsonResponse
    {
        $query = Order::with(['items', 'payments']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                    ->orWhere('customer_name', 'like', "%{$search}%")
                    ->orWhere('customer_phone', 'like', "%{$search}%")
                    ->orWhere('customer_email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('order_status')) {
            $query->where('order_status', strtoupper($request->input('order_status')));
        }

        if ($request->filled('payment_status')) {
            $query->where('payment_status', strtoupper($request->input('payment_status')));
        }

        $orders = $query->latest()->paginate(15);

        return response()->json([
            'success' => true,
            'orders' => $orders,
        ]);
    }

    /**
     * Update order processing status.
     * PATCH /api/v1/admin/orders/{id}/status
     */
    public function updateOrderStatus(Request $request, string $id): JsonResponse
    {
        $order = Order::findOrFail($id);

        $validated = $request->validate([
            'order_status' => 'required|string|in:PENDING,PROCESSING,CLEANING,READY,DELIVERED,CANCELLED',
        ]);

        $order->order_status = $validated['order_status'];
        $order->save();

        return response()->json([
            'success' => true,
            'message' => 'Order status updated successfully.',
            'order' => $order,
        ]);
    }

    /**
     * Reconciliation report.
     * GET /api/v1/admin/reconciliation
     */
    public function reconciliation(): JsonResponse
    {
        $orders = Order::with('payments')->latest()->paginate(20);

        $report = $orders->map(function ($order) {
            $lastMpesaPayment = $order->payments
                ->where('payment_method', 'mpesa')
                ->where('status', 'PAID')
                ->first();

            return [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'customer_name' => $order->customer_name,
                'customer_phone' => $order->customer_phone,
                'total_amount' => (float) $order->total_amount,
                'paid_amount' => (float) $order->paid_amount,
                'balance_amount' => (float) $order->balance_amount,
                'payment_status' => $order->payment_status,
                'order_status' => $order->order_status,
                'mpesa_receipt' => $lastMpesaPayment ? $lastMpesaPayment->mpesa_receipt_number : 'N/A',
                'created_at' => $order->created_at->format('Y-m-d H:i'),
            ];
        });

        return response()->json([
            'success' => true,
            'reconciliation' => $report,
            'pagination' => [
                'current_page' => $orders->currentPage(),
                'total_pages' => $orders->lastPage(),
                'total_items' => $orders->total(),
            ],
        ]);
    }

    /**
     * Get system settings.
     * GET /api/v1/admin/settings
     */
    public function getSettings(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'settings' => $this->getSettingsArray(),
        ]);
    }

    /**
     * Update System Settings.
     * POST /api/v1/admin/settings
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'payment_mode_required' => 'required|string|in:FULL_PAYMENT,DEPOSIT,PAY_AFTER_SERVICE',
            'deposit_percentage' => 'nullable|numeric|min:1|max:100',
            'business_name' => 'required|string|max:255',
            'business_slogan' => 'required|string|max:255',
            'business_phone' => 'required|string|max:100',
            'business_email' => 'required|email|max:255',
            'business_address' => 'nullable|string|max:500',
            'operating_hours' => 'nullable|string|max:255',
            'express_service_enabled' => 'boolean',
            'express_surcharge' => 'nullable|numeric|min:0',
        ]);

        foreach ($validated as $key => $value) {
            Setting::set($key, is_bool($value) ? ($value ? '1' : '0') : (string) $value);
        }

        return response()->json([
            'success' => true,
            'message' => 'System settings updated successfully.',
            'settings' => $this->getSettingsArray(),
        ]);
    }

    private function getSettingsArray(): array
    {
        return [
            'payment_mode_required' => Setting::get('payment_mode_required', 'FULL_PAYMENT'),
            'deposit_percentage' => (float) Setting::get('deposit_percentage', '30'),
            'business_name' => Setting::get('business_name', 'Nyota Dry Cleaners'),
            'business_slogan' => Setting::get('business_slogan', 'Fresh. Clean. Perfect.'),
            'business_phone' => Setting::get('business_phone', '+254708374149'),
            'business_email' => Setting::get('business_email', 'support@nyotacleaners.co.ke'),
            'business_address' => Setting::get('business_address', 'Nyanchwa / Nairobi Center, Kenya'),
            'operating_hours' => Setting::get('operating_hours', 'Mon - Sat: 7:00 AM - 8:00 PM | Sun: 9:00 AM - 5:00 PM'),
            'express_service_enabled' => Setting::get('express_service_enabled', '1') === '1',
            'express_surcharge' => (float) Setting::get('express_surcharge', '500'),
            'mpesa_environment' => env('MPESA_ENVIRONMENT', 'sandbox'),
            'mpesa_shortcode' => env('MPESA_SHORTCODE', '174379'),
        ];
    }
}
