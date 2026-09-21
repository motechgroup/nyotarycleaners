<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            'payment_mode_required' => 'FULL_PAYMENT',
            'deposit_percentage' => '30',
            'business_name' => 'Nyota Dry Cleaners',
            'business_slogan' => 'Fresh. Clean. Perfect.',
            'business_phone' => '+254708374149',
            'business_email' => 'support@nyotacleaners.co.ke',
        ];

        foreach ($settings as $key => $value) {
            Setting::set($key, $value);
        }
    }
}
