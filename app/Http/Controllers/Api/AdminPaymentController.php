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
            ],
            'recent_transactions' => $recentTransactions,
            'payment_mode_required' => Setting::get('payment_mode_required', 'FULL_PAYMENT'),
        ]);
    }

    /**
     * Search and filter payments for Admin ERP.
     * GET /api/v1/admin/payments
     */
    public function payments(Request $request): JsonResponse
    {
        $query = Payment::with('order');

        // Search by receipt, customer, phone, order number, or reference
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

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', strtoupper($request->input('status')));
        }

        // Filter by payment method
        if ($request->filled('method')) {
            $query->where('payment_method', strtolower($request->input('method')));
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }

        $payments = $query->latest()->paginate(20);

        return response()->json([
            'success' => true,
            'payments' => $payments,
        ]);
    }

    /**
     * Reconciliation report: Orders with Totals, Paid, M-Pesa Receipt, and Balances.
     * GET /api/v1/admin/reconciliation
     */
    public function reconciliation(Request $request): JsonResponse
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
                'mpesa_receipt' => $lastMpesaPayment ? $lastMpesaPayment->mpesa_receipt_number : 'N/A',
                'payment_method' => $order->payments->first() ? strtoupper($order->payments->first()->payment_method) : 'N/A',
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
     * Update Business Payment Configuration.
     * POST /api/v1/admin/settings
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'payment_mode_required' => 'required|string|in:FULL_PAYMENT,DEPOSIT,PAY_AFTER_SERVICE',
            'deposit_percentage' => 'nullable|numeric|min:1|max:100',
        ]);

        Setting::set('payment_mode_required', $validated['payment_mode_required']);

        if (isset($validated['deposit_percentage'])) {
            Setting::set('deposit_percentage', (string) $validated['deposit_percentage']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Payment rules updated successfully.',
            'settings' => [
                'payment_mode_required' => Setting::get('payment_mode_required'),
                'deposit_percentage' => Setting::get('deposit_percentage'),
            ],
        ]);
    }
}
