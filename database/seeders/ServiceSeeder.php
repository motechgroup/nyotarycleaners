<?php

namespace Database\Seeders;

use App\Models\Service;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        $services = [
            [
                'name' => 'Laundry Washing',
                'description' => 'Professional washing to remove dirt, stains, and odors. Deep-cleans everyday wear, safe on all fabrics with a fresh, neutral scent.',
                'category' => 'Core Laundry',
                'unit_price' => 350.00,
                'unit_name' => '5kg load',
                'is_active' => true,
            ],
            [
                'name' => 'Dry Cleaning',
                'description' => 'Specialized care for garments requiring dry cleaning. Gentle on suits & delicates, no shrinkage or fading, with a crisp pressed finish.',
                'category' => 'Specialty Care',
                'unit_price' => 800.00,
                'unit_name' => 'suit / garment',
                'is_active' => true,
            ],
            [
                'name' => 'Ironing',
                'description' => 'Clean and professionally pressed clothing. Sharp, wrinkle-free results with careful heat control, ready to wear or hang.',
                'category' => 'Pressing & Finishing',
                'unit_price' => 200.00,
                'unit_name' => 'item',
                'is_active' => true,
            ],
            [
                'name' => 'Folding',
                'description' => 'Neatly folded clothing ready for storage or use. Tidy uniform folds that save time at home, great for bulk laundry.',
                'category' => 'Finishing & Storage',
                'unit_price' => 150.00,
                'unit_name' => 'load',
                'is_active' => true,
            ],
            [
                'name' => 'Deep Cleaning',
                'description' => 'Care for heavily soiled garments and difficult stains. Extra wash & rinse cycles to tackle tough stains and restore heavily used items.',
                'category' => 'Heavy-Duty Care',
                'unit_price' => 1000.00,
                'unit_name' => 'item',
                'is_active' => true,
            ],
            [
                'name' => 'Carpet Cleaning',
                'description' => 'Professional cleaning for carpets and rugs. Removes deep dirt & odour, safe for most carpet materials with fast thorough drying.',
                'category' => 'Home & Floor Care',
                'unit_price' => 1500.00,
                'unit_name' => 'carpet / rug',
                'is_active' => true,
            ],
            [
                'name' => 'Shoe Cleaning',
                'description' => 'Cleaning and care for shoes and sneakers. Restores footwear with careful material-specific cleaning, great before big events.',
                'category' => 'Footwear Care',
                'unit_price' => 500.00,
                'unit_name' => 'pair',
                'is_active' => true,
            ],
            [
                'name' => 'Custom / Bespoke Request',
                'description' => 'Custom cleaning solutions for unlisted or specialized items. Tell us what you need and our team will confirm details directly.',
                'category' => 'Custom Care',
                'unit_price' => 500.00,
                'unit_name' => 'request',
                'is_active' => true,
            ],
        ];

        foreach ($services as $service) {
            Service::updateOrCreate(['name' => $service['name']], $service);
        }
    }
}
