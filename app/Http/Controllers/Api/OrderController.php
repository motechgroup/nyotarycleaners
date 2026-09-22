<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
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
     * Standardizes phone to Kenyan format (07XXXXXXXX or 01XXXXXXXX).
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

        $normalizedPhone = Customer::normalizePhone($phone);

        $customer = Customer::where('phone', $normalizedPhone)->first();

        $orders = Order::with('items')
            ->where(function ($query) use ($normalizedPhone, $phone) {
                $query->where('customer_phone', $normalizedPhone)
                    ->orWhere('customer_phone', 'like', "%{$normalizedPhone}%")
                    ->orWhere('customer_phone', $phone);
            })
            ->latest()
            ->get();

        if (! $customer && $orders->isEmpty()) {
            return response()->json([
                'success' => true,
                'is_returning_customer' => false,
                'message' => 'New customer. A new customer profile will be created upon placing order.',
                'customer_phone' => $normalizedPhone,
                'total_orders' => 0,
                'total_spent' => 0,
                'customer_name' => null,
                'orders' => [],
            ]);
        }

        $customerName = $customer?->name;
        if (empty($customerName) || str_starts_with($customerName, 'Client ')) {
            $lastOrderWithName = $orders->first(fn ($o) => ! empty($o->customer_name) && ! str_starts_with($o->customer_name, 'Client '));
            if ($lastOrderWithName) {
                $customerName = $lastOrderWithName->customer_name;
            }
        }

        $totalSpent = $customer ? (float) $customer->total_spent : (float) $orders->sum('paid_amount');
        $totalOrders = $customer ? $customer->total_orders : $orders->count();
        $outstandingBalance = (float) $orders->sum('balance_amount');

        return response()->json([
            'success' => true,
            'is_returning_customer' => true,
            'customer_id' => $customer?->id,
            'customer_phone' => $normalizedPhone ?: $phone,
            'customer_name' => $customerName,
            'total_orders' => $totalOrders,
            'total_spent' => $totalSpent,
            'outstanding_balance' => $outstandingBalance,
            'orders' => $orders->take(5),
        ]);
    }

    /**
     * Create a new customer laundry order using Phone Number as primary identifier.
     * Auto-creates customer if phone number does not exist in system.
     * Normalizes phone to standard Kenyan 07XX / 01XX format.
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

        $normalizedPhone = Customer::normalizePhone($validated['customer_phone']);

        $order = DB::transaction(function () use ($validated, $normalizedPhone) {
            $paymentModeRequired = Setting::get('payment_mode_required', 'FULL_PAYMENT');
            $depositPercentage = (float) Setting::get('deposit_percentage', '30');

            // 1. Find existing customer or auto-create new customer by default!
            $customer = Customer::findOrCreateByPhone(
                $normalizedPhone,
                $validated['customer_name'] ?? null,
                $validated['customer_email'] ?? null,
                $validated['delivery_address'] ?? null
            );

            $customerName = $customer->name;

            $orderNumber = 'NY-'.date('Ymd').'-'.rand(1000, 9999);

            // 2. Record order with customer linkage
            $order = Order::create([
                'order_number' => $orderNumber,
                'customer_id' => $customer->id,
                'customer_name' => $customerName,
                'customer_email' => $validated['customer_email'] ?? $customer->email,
                'customer_phone' => $normalizedPhone,
                'delivery_option' => $validated['delivery_option'] ?? 'drop_off',
                'delivery_address' => $validated['delivery_address'] ?? $customer->address,
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

            // Recalculate customer statistics
            $customer->recalculateStats();

            return $order->load(['items', 'customer']);
        });

        return response()->json([
            'success' => true,
            'message' => 'Order created successfully and customer record linked.',
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
