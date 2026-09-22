<?php

namespace Tests\Feature;

use App\Models\Service;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminServiceManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_fetch_services_list(): void
    {
        Service::create([
            'name' => 'Laundry Washing',
            'category' => 'Core Laundry',
            'unit_price' => 350.00,
            'unit_name' => '5kg load',
        ]);

        $response = $this->getJson('/api/v1/admin/services');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonFragment(['name' => 'Laundry Washing']);
    }

    public function test_admin_can_create_new_service(): void
    {
        $payload = [
            'name' => 'Express Jacket Cleaning',
            'description' => 'Fast 2-hour dry cleaning service for leather and fabric jackets.',
            'category' => 'Specialty Care',
            'unit_price' => 1200.00,
            'unit_name' => 'jacket',
            'is_active' => true,
        ];

        $response = $this->postJson('/api/v1/admin/services', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('service.name', 'Express Jacket Cleaning')
            ->assertJsonPath('service.unit_price', '1200.00');

        $this->assertDatabaseHas('services', [
            'name' => 'Express Jacket Cleaning',
            'unit_price' => 1200.00,
        ]);
    }

    public function test_admin_can_update_service_price(): void
    {
        $service = Service::create([
            'name' => 'Shoe Cleaning',
            'category' => 'Footwear Care',
            'unit_price' => 500.00,
            'unit_name' => 'pair',
        ]);

        $response = $this->putJson("/api/v1/admin/services/{$service->id}", [
            'name' => 'Shoe Cleaning',
            'category' => 'Footwear Care',
            'unit_price' => 650.00,
            'unit_name' => 'pair',
            'description' => 'Updated premium footwear restoration.',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('service.unit_price', '650.00');

        $this->assertDatabaseHas('services', [
            'id' => $service->id,
            'unit_price' => 650.00,
        ]);
    }

    public function test_admin_can_toggle_service_active_status(): void
    {
        $service = Service::create([
            'name' => 'Deep Cleaning',
            'category' => 'Heavy-Duty Care',
            'unit_price' => 1000.00,
            'unit_name' => 'item',
            'is_active' => true,
        ]);

        $response = $this->patchJson("/api/v1/admin/services/{$service->id}/toggle-status");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('is_active', false);

        $this->assertDatabaseHas('services', [
            'id' => $service->id,
            'is_active' => false,
        ]);
    }
}
