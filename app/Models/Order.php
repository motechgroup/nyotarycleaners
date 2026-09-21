<?php

namespace App\Models;

use Database\Factories\OrderFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    /** @use HasFactory<OrderFactory> */
    use HasFactory;

    protected $fillable = [
        'order_number',
        'customer_name',
        'customer_email',
        'customer_phone',
        'delivery_option',
        'delivery_address',
        'pickup_date',
        'total_amount',
        'deposit_amount',
        'paid_amount',
        'balance_amount',
        'payment_status',
        'order_status',
        'payment_mode_required',
        'notes',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'deposit_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'balance_amount' => 'decimal:2',
        'pickup_date' => 'date',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function recalculatePaymentStatus(): void
    {
        $successfulPaidSum = (float) $this->payments()
            ->where('status', 'PAID')
            ->sum('amount');

        $this->paid_amount = $successfulPaidSum;
        $total = (float) $this->total_amount;
        $this->balance_amount = max(0, $total - $successfulPaidSum);

        if ($successfulPaidSum >= $total && $total > 0) {
            $this->payment_status = 'PAID';
        } elseif ($successfulPaidSum > 0) {
            $this->payment_status = 'PARTIALLY_PAID';
        } else {
            $this->payment_status = 'UNPAID';
        }

        $this->save();
    }
}
