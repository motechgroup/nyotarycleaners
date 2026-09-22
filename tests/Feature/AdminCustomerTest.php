<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminCustomerTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_customers_with_summary_stats(): void
    {
        Customer::create([
            'phone' => '0711223344',
            'name' => 'Sarah Wambui',
            'total_orders' => 2,
            'total_spent' => 2500.00,
        ]);

        Customer::create([
            'phone' => '0111223344',
            'name' => 'David Kiprop',
            'total_orders' => 1,
            'total_spent' => 800.00,
        ]);

        $response = $this->getJson('/api/v1/admin/customers');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('summary.total_customers', 2)
            ->assertJsonPath('summary.returning_customers', 1)
            ->assertJsonPath('summary.total_spend', 3300);
    }

    public function test_can_search_customers_by_phone_or_name(): void
    {
        Customer::create([
            'phone' => '0722001122',
            'name' => 'Grace Mwangi',
            'total_orders' => 1,
        ]);

        Customer::create([
            'phone' => '0733001122',
            'name' => 'Otieno Brian',
            'total_orders' => 3,
        ]);

        $response = $this->getJson('/api/v1/admin/customers?search=Grace');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'customers')
            ->assertJsonPath('customers.0.name', 'Grace Mwangi');
    }

    public function test_can_show_customer_details_with_orders(): void
    {
        $customer = Customer::create([
            'phone' => '0744001122',
            'name' => 'James Bond',
            'total_orders' => 1,
        ]);

        Order::create([
            'order_number' => 'NY-TEST-999',
            'customer_id' => $customer->id,
            'customer_name' => 'James Bond',
            'customer_phone' => '0744001122',
            'total_amount' => 1500.00,
        ]);

        $response = $this->getJson("/api/v1/admin/customers/{$customer->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('customer.name', 'James Bond')
            ->assertJsonCount(1, 'customer.orders');
    }

    public function test_can_update_customer_profile(): void
    {
        $customer = Customer::create([
            'phone' => '0755001122',
            'name' => 'Old Name',
        ]);

        $response = $this->putJson("/api/v1/admin/customers/{$customer->id}", [
            'name' => 'New Updated Name',
            'email' => 'client@example.com',
            'address' => 'Nairobi West, Kenya',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('customer.name', 'New Updated Name');

        $this->assertDatabaseHas('customers', [
            'id' => $customer->id,
            'name' => 'New Updated Name',
            'email' => 'client@example.com',
        ]);
    }
}
