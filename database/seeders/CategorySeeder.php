<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            ['name' => 'News', 'slug' => 'news'],
            ['name' => 'Memes', 'slug' => 'memes'],
            ['name' => 'Entertainment', 'slug' => 'entertainment'],
            ['name' => 'Study', 'slug' => 'study'],
            // Note: 'All' is typically a frontend filter option, not a stored category
        ];

        foreach ($categories as $categoryData) {
            // updateOrCreate prevents errors if the seeder is run multiple times
            Category::updateOrCreate(
                ['name' => $categoryData['name']], // Unique key to check for existing record
                $categoryData // Data to insert or update if record exists
            );
        }
    }
}