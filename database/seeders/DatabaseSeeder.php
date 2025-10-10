<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // \App\Models\User::factory(10)->create();

        // \App\Models\User::factory()->create([
        //     'name' => 'Test User',
        //     'email' => 'test@example.com',
        // ]);
        
        $this->call([
             UserSeeder::class,      // Users first (if posts depend on users existing, though factory handles this)
             FollowSeeder::class,    // Follows next (if relevant)
             CategorySeeder::class,  // Categories BEFORE PostSeeder
             PostSeeder::class,      // PostSeeder runs after categories exist
        ]);
    }
}