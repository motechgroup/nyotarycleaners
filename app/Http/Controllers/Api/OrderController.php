<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Service;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    /**
     * Get active services and business configuration for booking.
     * GET /api/v1/services
     */
    public function services(): JsonResponse
    {
        $services = Service::where('is_active', true)->get();
        $paymentModeRequired = Setting::get('payment_mode_required', 'FULL_PAYMENT');
        $depositPercentage = (float) Setting::get('deposit_percentage', '30');

        return response()->json([
            'success' => true,
            'services' => $services,
            'config' => [
                'payment_mode_required' => $paymentModeRequired,
                'deposit_percentage' => $depositPercentage,
                'business_name' => Setting::get('business_name', 'Nyota Dry Cleaners'),
                'business_slogan' => Setting::get('business_slogan', 'Fresh. Clean. Perfect.'),
            ],
        ]);
    }

    /**
     * Lookup Customer History by Phone Number.
     * GET /api/v1/customers/history?phone=07XXXXXXXX
     */
    public function customerHistory(Request $request): JsonResponse
    {
        $phone = $request->input('phone');

        if (empty($phone)) {
            return response()->json([
                'success' => false,
                'message' => 'Phone number parameter is required.',
            ], 400);
        }

        $cleanedPhone = preg_replace('/[^0-9]/', '', $phone);

        $orders = Order::with('items')
            ->where('customer_phone', 'like', "%{$cleanedPhone}%")
            ->latest()
            ->get();

        if ($orders->isEmpty()) {
            return response()->json([
                'success' => true,
                'is_returning_customer' => false,
                'message' => 'New customer.',
                'total_orders' => 0,
                'total_spent' => 0,
                'customer_name' => null,
                'orders' => [],
            ]);
        }

        $lastOrderWithName = $orders->first(fn ($o) => ! empty($o->customer_name) && ! str_starts_with($o->customer_name, 'Client '));
        $customerName = $lastOrderWithName ? $lastOrderWithName->customer_name : $orders->first()->customer_name;

        $totalSpent = (float) $orders->sum('paid_amount');
        $totalOrders = $orders->count();
        $outstandingBalance = (float) $orders->sum('balance_amount');

        return response()->json([
            'success' => true,
            'is_returning_customer' => true,
            'customer_phone' => $phone,
            'customer_name' => $customerName,
            'total_orders' => $totalOrders,
            'total_spent' => $totalSpent,
            'outstanding_balance' => $outstandingBalance,
            'orders' => $orders->take(5),
        ]);
    }

    /**
     * Create a new customer laundry order using Phone Number as primary identifier.
     * POST /api/v1/orders
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_phone' => 'required|string|min:9|max:15',
            'customer_name' => 'nullable|string|max:255',
            'customer_email' => 'nullable|email|max:255',
            'delivery_option' => 'nullable|string|in:pickup_delivery,drop_off',
            'delivery_address' => 'nullable|string|max:500',
            'pickup_date' => 'nullable|date',
            'notes' => 'nullable|string|max:1000',
            'items' => 'required|array|min:1',
            'items.*.service_id' => 'required|exists:services,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $order = DB::transaction(function () use ($validated) {
            $paymentModeRequired = Setting::get('payment_mode_required', 'FULL_PAYMENT');
            $depositPercentage = (float) Setting::get('deposit_percentage', '30');

            $phone = $validated['customer_phone'];

            // If name not provided, auto-assign from past history or default to "Client [phone]"
            $customerName = ! empty($validated['customer_name'])
                ? $validated['customer_name']
                : (Order::where('customer_phone', $phone)->whereNotNull('customer_name')->value('customer_name') ?? ('Client '.substr($phone, -4)));

            $orderNumber = 'NY-'.date('Ymd').'-'.rand(1000, 9999);

            $order = Order::create([
                'order_number' => $orderNumber,
                'customer_name' => $customerName,
                'customer_email' => $validated['customer_email'] ?? null,
                'customer_phone' => $phone,
                'delivery_option' => $validated['delivery_option'] ?? 'drop_off',
                'delivery_address' => $validated['delivery_address'] ?? null,
                'pickup_date' => $validated['pickup_date'] ?? null,
                'total_amount' => 0,
                'deposit_amount' => 0,
                'paid_amount' => 0,
                'balance_amount' => 0,
                'payment_status' => 'UNPAID',
                'order_status' => 'PENDING',
                'payment_mode_required' => $paymentModeRequired,
                'notes' => $validated['notes'] ?? null,
            ]);

            $totalAmount = 0;

            foreach ($validated['items'] as $itemData) {
                $service = Service::findOrFail($itemData['service_id']);
                $subtotal = $service->unit_price * $itemData['quantity'];
                $totalAmount += $subtotal;

                OrderItem::create([
                    'order_id' => $order->id,
                    'service_id' => $service->id,
                    'service_name' => $service->name,
                    'quantity' => $itemData['quantity'],
                    'unit_price' => $service->unit_price,
                    'subtotal' => $subtotal,
                ]);
            }

            $depositAmount = 0;
            if ($paymentModeRequired === 'DEPOSIT') {
                $depositAmount = round(($totalAmount * $depositPercentage) / 100, 2);
            } elseif ($paymentModeRequired === 'FULL_PAYMENT') {
                $depositAmount = $totalAmount;
            }

            $order->update([
                'total_amount' => $totalAmount,
                'deposit_amount' => $depositAmount,
                'balance_amount' => $totalAmount,
            ]);

            return $order->load('items');
        });

        return response()->json([
            'success' => true,
            'message' => 'Order created successfully.',
            'order' => $order,
        ], 201);
    }

    /**
     * Get specific order details.
     * GET /api/v1/orders/{id}
     */
    public function show(string $id): JsonResponse
    {
        $order = Order::with(['items', 'payments'])->find($id)
            ?? Order::with(['items', 'payments'])->where('order_number', $id)->firstOrFail();

        return response()->json([
            'success' => true,
            'order' => $order,
        ]);
    }
}
