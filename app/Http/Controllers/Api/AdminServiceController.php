<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminServiceController extends Controller
{
    /**
     * Fetch all services for Admin ERP.
     * GET /api/v1/admin/services
     */
    public function index(): JsonResponse
    {
        $services = Service::latest()->get();

        return response()->json([
            'success' => true,
            'services' => $services,
        ]);
    }

    /**
     * Create a new dry cleaning service.
     * POST /api/v1/admin/services
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'category' => 'required|string|max:255',
            'unit_price' => 'required|numeric|min:0',
            'unit_name' => 'required|string|max:100',
            'is_active' => 'boolean',
        ]);

        $service = Service::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'category' => $validated['category'],
            'unit_price' => $validated['unit_price'],
            'unit_name' => $validated['unit_name'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Service created successfully.',
            'service' => $service,
        ], 201);
    }

    /**
     * Update an existing service and its price.
     * PUT /api/v1/admin/services/{id}
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $service = Service::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'category' => 'required|string|max:255',
            'unit_price' => 'required|numeric|min:0',
            'unit_name' => 'required|string|max:100',
            'is_active' => 'boolean',
        ]);

        $service->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'category' => $validated['category'],
            'unit_price' => $validated['unit_price'],
            'unit_name' => $validated['unit_name'],
            'is_active' => $validated['is_active'] ?? $service->is_active,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Service and price updated successfully.',
            'service' => $service,
        ]);
    }

    /**
     * Toggle active/inactive status of a service.
     * PATCH /api/v1/admin/services/{id}/toggle-status
     */
    public function toggleStatus(string $id): JsonResponse
    {
        $service = Service::findOrFail($id);
        $service->is_active = ! $service->is_active;
        $service->save();

        return response()->json([
            'success' => true,
            'message' => 'Service status updated.',
            'is_active' => $service->is_active,
        ]);
    }

    /**
     * Delete a service.
     * DELETE /api/v1/admin/services/{id}
     */
    public function destroy(string $id): JsonResponse
    {
        $service = Service::findOrFail($id);
        $service->delete();

        return response()->json([
            'success' => true,
            'message' => 'Service deleted successfully.',
        ]);
    }
}
