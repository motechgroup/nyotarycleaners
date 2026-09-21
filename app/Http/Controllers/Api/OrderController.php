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
     * Create a new customer laundry order.
     * POST /api/v1/orders
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'nullable|email|max:255',
            'customer_phone' => 'required|string|min:9|max:15',
            'delivery_option' => 'required|string|in:pickup_delivery,drop_off',
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

            // Generate unique Order Number
            $orderNumber = 'NY-'.date('Ymd').'-'.rand(1000, 9999);

            $order = Order::create([
                'order_number' => $orderNumber,
                'customer_name' => $validated['customer_name'],
                'customer_email' => $validated['customer_email'] ?? null,
                'customer_phone' => $validated['customer_phone'],
                'delivery_option' => $validated['delivery_option'],
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
