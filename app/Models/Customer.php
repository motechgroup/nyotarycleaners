<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'phone',
        'name',
        'email',
        'address',
        'total_orders',
        'total_spent',
        'last_order_at',
    ];

    protected $casts = [
        'total_orders' => 'integer',
        'total_spent' => 'float',
        'last_order_at' => 'datetime',
    ];

    /**
     * Customer orders relationship.
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Standardize and normalize phone numbers for the Kenyan market.
     * Enforces standard 10-digit 07XX or 01XX format.
     * E.g.
     *   +254712345678 -> 0712345678
     *   254712345678  -> 0712345678
     *   254112345678  -> 0112345678
     *   712345678     -> 0712345678
     *   112345678     -> 0112345678
     *   0712345678    -> 0712345678
     *   0112345678    -> 0112345678
     */
    public static function normalizePhone(?string $phone): string
    {
        if (empty($phone)) {
            return '';
        }

        // Remove non-digit characters
        $digits = preg_replace('/[^0-9]/', '', $phone);

        // Convert leading 254 (12 digits) to 0
        if (str_starts_with($digits, '254') && strlen($digits) === 12) {
            $digits = '0'.substr($digits, 3);
        }

        // Convert 9 digits starting with 7 or 1 to 07 / 01
        if (strlen($digits) === 9 && (str_starts_with($digits, '7') || str_starts_with($digits, '1'))) {
            $digits = '0'.$digits;
        }

        return $digits;
    }

    /**
     * Check if a phone number is a valid 10-digit Kenyan mobile number starting with 07 or 01.
     */
    public static function isValidKenyanPhone(?string $phone): bool
    {
        $normalized = self::normalizePhone($phone);

        return (bool) preg_match('/^(07|01)\d{8}$/', $normalized);
    }

    /**
     * Convert normalized 07/01 phone number to Safaricom Daraja M-Pesa format (2547... or 2541...).
     */
    public static function toMpesaPhone(?string $phone): string
    {
        $normalized = self::normalizePhone($phone);
        if (str_starts_with($normalized, '0')) {
            return '254'.substr($normalized, 1);
        }

        return $normalized;
    }

    /**
     * Find existing customer by phone number or create a new customer record default entry.
     */
    public static function findOrCreateByPhone(string $rawPhone, ?string $name = null, ?string $email = null, ?string $address = null): self
    {
        $normalizedPhone = self::normalizePhone($rawPhone);

        $customer = self::where('phone', $normalizedPhone)->first();

        if (! $customer) {
            $defaultName = ! empty($name) ? trim($name) : ('Client '.substr($normalizedPhone, -4));

            $customer = self::create([
                'phone' => $normalizedPhone,
                'name' => $defaultName,
                'email' => $email,
                'address' => $address,
                'total_orders' => 0,
                'total_spent' => 0,
                'last_order_at' => now(),
            ]);
        } else {
            // Update customer details if custom name provided and existing name is default "Client XXXX"
            $shouldUpdateName = ! empty($name) && (empty($customer->name) || str_starts_with($customer->name, 'Client '));
            $updates = [];

            if ($shouldUpdateName) {
                $updates['name'] = trim($name);
            }
            if (! empty($email) && empty($customer->email)) {
                $updates['email'] = $email;
            }
            if (! empty($address) && empty($customer->address)) {
                $updates['address'] = $address;
            }

            $updates['last_order_at'] = now();

            if (! empty($updates)) {
                $customer->update($updates);
            }
        }

        return $customer;
    }

    /**
     * Recalculate customer order count and total spent from orders.
     */
    public function recalculateStats(): void
    {
        $totalOrders = $this->orders()->count();
        $totalSpent = (float) $this->orders()->sum('paid_amount');

        $this->update([
            'total_orders' => $totalOrders,
            'total_spent' => $totalSpent,
        ]);
    }
}
