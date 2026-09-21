<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Service;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderPaymentTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_fetch_services_list(): void
    {
        Service::create([
            'name' => 'Suit Dry Cleaning',
            'category' => 'Suits',
            'unit_price' => 800.00,
            'unit_name' => 'suit',
        ]);

        $response = $this->getJson('/api/v1/services');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonFragment(['name' => 'Suit Dry Cleaning']);
    }

    public function test_can_create_order_via_api(): void
    {
        $service = Service::create([
            'name' => 'Wash and Fold',
            'category' => 'Laundry',
            'unit_price' => 500.00,
            'unit_name' => 'load',
        ]);

        $payload = [
            'customer_name' => 'Alice Johnson',
            'customer_phone' => '0711223344',
            'delivery_option' => 'pickup_delivery',
            'delivery_address' => 'Kilimani, Nairobi',
            'items' => [
                [
                    'service_id' => $service->id,
                    'quantity' => 2,
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/orders', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('order.customer_name', 'Alice Johnson')
            ->assertJsonPath('order.total_amount', '1000.00');

        $this->assertDatabaseHas('orders', [
            'customer_name' => 'Alice Johnson',
            'total_amount' => 1000.00,
        ]);
    }

    public function test_can_trigger_stk_push_endpoint(): void
    {
        $order = Order::create([
            'order_number' => 'NY-TEST-201',
            'customer_name' => 'Bob Builder',
            'customer_phone' => '0722334455',
            'total_amount' => 1000.00,
            'balance_amount' => 1000.00,
            'payment_status' => 'UNPAID',
        ]);

        $response = $this->postJson('/api/v1/payments/mpesa/stk-push', [
            'order_id' => $order->id,
            'phone_number' => '0722334455',
            'amount' => 1000.00,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Check your phone for the M-Pesa payment prompt.');
    }

    public function test_admin_dashboard_stats_endpoint(): void
    {
        $response = $this->getJson('/api/v1/admin/dashboard-stats');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'stats' => [
                    'todays_revenue',
                    'mpesa_revenue',
                    'cash_revenue',
                    'pending_payments',
                    'failed_payments',
                    'outstanding_balances',
                ],
            ]);
    }
}
