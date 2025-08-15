<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Post; // Import the Post model
use App\Models\User; // Import the User model

class PostSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ensure some users exist first (optional, but good practice if posts need users)
        // If you rely on the UserFactory within PostFactory, this might not be strictly necessary
        // for the factory itself, but good for consistency.
        if (User::count() == 0) {
             User::factory()->count(5)->create(); // Create 5 fake users if none exist
        }


        // Create a specific number of fake posts using the PostFactory
        // This will use the definition from PostFactory.php
        Post::factory()
            ->count(20) // Create 20 fake posts
            ->create();

        // Optional: Create posts with specific relationships or states
        // For example, if you had a 'published' state on your Post model:
        // Post::factory()->published()->count(5)->create();
    }
}