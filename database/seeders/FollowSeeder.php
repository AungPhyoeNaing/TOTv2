<?php

namespace Database\Seeders;

use App\Models\Follow;
use App\Models\User;
use Illuminate\Database\Seeder;

class FollowSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create 10 users
        $users = User::factory()->count(10)->create();
        
        // Create follow relationships
        foreach ($users as $user) {
            // Each user follows 3 random users
            $followees = $users->where('id', '!=', $user->id)->random(3);
            
            foreach ($followees as $followee) {
                Follow::factory()->create([
                    'follower_id' => $user->id,
                    'followee_id' => $followee->id,
                ]);
            }
        }
    }
}