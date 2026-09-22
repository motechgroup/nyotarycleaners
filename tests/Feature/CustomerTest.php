<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Service;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerTest extends TestCase
{
    use RefreshDatabase;

    public function test_kenyan_phone_normalization_and_validation(): void
    {
        $this->assertEquals('0712345678', Customer::normalizePhone('0712345678'));
        $this->assertEquals('0112345678', Customer::normalizePhone('0112345678'));
        $this->assertEquals('0712345678', Customer::normalizePhone('+254712345678'));
        $this->assertEquals('0112345678', Customer::normalizePhone('254112345678'));
        $this->assertEquals('0712345678', Customer::normalizePhone('712345678'));
        $this->assertEquals('0112345678', Customer::normalizePhone('112345678'));

        $this->assertTrue(Customer::isValidKenyanPhone('0712345678'));
        $this->assertTrue(Customer::isValidKenyanPhone('0112345678'));
        $this->assertTrue(Customer::isValidKenyanPhone('+254712345678'));
        $this->assertTrue(Customer::isValidKenyanPhone('254112345678'));

        $this->assertEquals('254712345678', Customer::toMpesaPhone('0712345678'));
        $this->assertEquals('254112345678', Customer::toMpesaPhone('0112345678'));
    }

    public function test_auto_creates_new_customer_on_order_creation(): void
    {
        $service = Service::create([
            'name' => 'Dry Cleaning Suit',
            'category' => 'Suits',
            'unit_price' => 1200.00,
            'unit_name' => 'piece',
        ]);

        $payload = [
            'customer_phone' => '+254799887766', // Entered with +254 prefix
            'customer_name' => 'John Kamau',
            'items' => [
                ['service_id' => $service->id, 'quantity' => 1],
            ],
        ];

        $response = $this->postJson('/api/v1/orders', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('order.customer_phone', '0799887766'); // Normalized to 0799887766

        // Assert customer record was auto-created in database
        $this->assertDatabaseHas('customers', [
            'phone' => '0799887766',
            'name' => 'John Kamau',
            'total_orders' => 1,
        ]);
    }

    public function test_links_existing_customer_on_subsequent_orders(): void
    {
        $service = Service::create([
            'name' => 'Shirt Laundering',
            'category' => 'Shirts',
            'unit_price' => 300.00,
            'unit_name' => 'piece',
        ]);

        $customer = Customer::create([
            'phone' => '0112233445', // 01 format
            'name' => 'Mary Wanjiku',
            'total_orders' => 0,
        ]);

        $payload = [
            'customer_phone' => '0112233445',
            'items' => [
                ['service_id' => $service->id, 'quantity' => 2],
            ],
        ];

        $response = $this->postJson('/api/v1/orders', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('order.customer_id', $customer->id)
            ->assertJsonPath('order.customer_name', 'Mary Wanjiku');

        $this->assertDatabaseHas('customers', [
            'id' => $customer->id,
            'total_orders' => 1,
        ]);
    }

    public function test_customer_history_lookup(): void
    {
        $customer = Customer::create([
            'phone' => '0700112233',
            'name' => 'Peter Ochieng',
            'total_orders' => 3,
            'total_spent' => 4500.00,
        ]);

        $response = $this->getJson('/api/v1/customers/history?phone=0700112233');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('is_returning_customer', true)
            ->assertJsonPath('customer_name', 'Peter Ochieng')
            ->assertJsonPath('total_orders', 3)
            ->assertJsonPath('total_spent', 4500);
    }
}
