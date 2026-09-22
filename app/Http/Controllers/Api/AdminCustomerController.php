<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminCustomerController extends Controller
{
    /**
     * List all customers with search and pagination/filtering.
     * GET /api/v1/admin/customers
     */
    public function index(Request $request): JsonResponse
    {
        $query = Customer::query();

        if ($search = $request->input('search')) {
            $normalizedSearch = Customer::normalizePhone($search);
            $query->where(function ($q) use ($search, $normalizedSearch) {
                $q->where('phone', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");

                if (! empty($normalizedSearch)) {
                    $q->orWhere('phone', 'like', "%{$normalizedSearch}%");
                }
            });
        }

        $customers = $query->orderByDesc('last_order_at')
            ->orderByDesc('created_at')
            ->get();

        $totalCustomers = Customer::count();
        $returningCount = Customer::where('total_orders', '>', 1)->count();
        $totalSpend = (float) Customer::sum('total_spent');

        return response()->json([
            'success' => true,
            'summary' => [
                'total_customers' => $totalCustomers,
                'returning_customers' => $returningCount,
                'total_spend' => $totalSpend,
            ],
            'customers' => $customers,
        ]);
    }

    /**
     * Get single customer with order history.
     * GET /api/v1/admin/customers/{id}
     */
    public function show(string $id): JsonResponse
    {
        $customer = Customer::with(['orders.items', 'orders.payments'])->find($id)
            ?? Customer::with(['orders.items', 'orders.payments'])->where('phone', Customer::normalizePhone($id))->firstOrFail();

        return response()->json([
            'success' => true,
            'customer' => $customer,
        ]);
    }

    /**
     * Update customer profile details.
     * PUT /api/v1/admin/customers/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $customer = Customer::findOrFail($id);

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|min:9|max:15',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:500',
        ]);

        $updates = [];

        if (array_key_exists('name', $validated)) {
            $updates['name'] = $validated['name'];
        }
        if (! empty($validated['phone'])) {
            $updates['phone'] = Customer::normalizePhone($validated['phone']);
        }
        if (array_key_exists('email', $validated)) {
            $updates['email'] = $validated['email'];
        }
        if (array_key_exists('address', $validated)) {
            $updates['address'] = $validated['address'];
        }

        $customer->update($updates);

        return response()->json([
            'success' => true,
            'message' => 'Customer profile updated successfully.',
            'customer' => $customer,
        ]);
    }

    /**
     * Delete customer record.
     * DELETE /api/v1/admin/customers/{id}
     */
    public function destroy(string $id): JsonResponse
    {
        $customer = Customer::findOrFail($id);
        $customer->delete();

        return response()->json([
            'success' => true,
            'message' => 'Customer removed successfully.',
        ]);
    }
}
