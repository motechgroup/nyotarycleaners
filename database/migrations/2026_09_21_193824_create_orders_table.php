<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->string('customer_name');
            $table->string('customer_email')->nullable();
            $table->string('customer_phone');
            $table->string('delivery_option')->default('pickup_delivery');
            $table->text('delivery_address')->nullable();
            $table->date('pickup_date')->nullable();
            $table->decimal('total_amount', 10, 2);
            $table->decimal('deposit_amount', 10, 2)->default(0);
            $table->decimal('paid_amount', 10, 2)->default(0);
            $table->decimal('balance_amount', 10, 2)->default(0);
            $table->string('payment_status')->default('UNPAID'); // UNPAID, PARTIALLY_PAID, PAID
            $table->string('order_status')->default('PENDING'); // PENDING, PROCESSING, CLEANING, READY, DELIVERED, CANCELLED
            $table->string('payment_mode_required')->default('FULL_PAYMENT'); // FULL_PAYMENT, DEPOSIT, PAY_AFTER_SERVICE
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
