<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds to create users.
     * This seeder focuses only on user creation.
     */
    public function run(): void
    {
        // Create a specific number of fake users
        User::factory()
            ->count(10) // Adjust the count as needed
            ->create();

        // Optional: Create specific users
        // User::factory()->create([
        //     'name' => 'Test User',
        //     'email' => 'test@example.com',
        // ]);
    }
}