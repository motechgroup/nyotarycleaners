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
                'name' => 'Wash, Dry & Fold',
                'description' => 'Everyday garments washed with gentle eco-friendly detergents, dried, and neatly folded.',
                'category' => 'Laundry',
                'unit_price' => 500.00,
                'unit_name' => '5kg load',
                'is_active' => true,
            ],
            [
                'name' => 'Executive Suit Dry Cleaning',
                'description' => 'Professional 2-piece or 3-piece suit dry cleaning with crisp steam pressing and garment bag.',
                'category' => 'Suits & Jackets',
                'unit_price' => 800.00,
                'unit_name' => 'suit',
                'is_active' => true,
            ],
            [
                'name' => 'Designer Dress & Evening Gown',
                'description' => 'Delicate fabric care for silk, chiffon, lace, or beaded dresses with fabric protection.',
                'category' => 'Dresses',
                'unit_price' => 1200.00,
                'unit_name' => 'dress',
                'is_active' => true,
            ],
            [
                'name' => 'Duvet & Heavy Blanket Deep Wash',
                'description' => 'Thorough sanitization and anti-allergen deep cleaning for king/queen size duvets.',
                'category' => 'Bedding',
                'unit_price' => 1000.00,
                'unit_name' => 'item',
                'is_active' => true,
            ],
            [
                'name' => 'Curtains & Sheer Drapery',
                'description' => 'Specialized dust-removal, stain treatment, and steam restoration for curtains.',
                'category' => 'Home Decor',
                'unit_price' => 1500.00,
                'unit_name' => 'pair',
                'is_active' => true,
            ],
            [
                'name' => 'Leather Jacket & Suede Care',
                'description' => 'Deep conditioning, color restoration, and gentle organic leather treatment.',
                'category' => 'Leather & Suede',
                'unit_price' => 2500.00,
                'unit_name' => 'garment',
                'is_active' => true,
            ],
            [
                'name' => 'Shirts Pressing & Laundry',
                'description' => 'Collared business shirts laundered, starched to preference, and steam pressed.',
                'category' => 'Shirts',
                'unit_price' => 250.00,
                'unit_name' => 'shirt',
                'is_active' => true,
            ],
        ];

        foreach ($services as $service) {
            Service::updateOrCreate(['name' => $service['name']], $service);
        }
    }
}
