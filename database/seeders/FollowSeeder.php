<?php

namespace Database\Seeders;

use App\Models\Follow;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema; // Optional: for disabling foreign key checks

class FollowSeeder extends Seeder
{
    /**
     * Run the database seeds to create follow relationships.
     * Assumes that users already exist in the database.
     * It's recommended to run UserSeeder before this seeder.
     */
    public function run(): void
    {
        // Optional: Disable foreign key checks temporarily
        // This can help avoid issues if truncating/running seeders frequently
        // Uncomment the lines below if needed and supported by your database
        // Schema::disableForeignKeyConstraints();
        // Follow::truncate(); // Clear existing follows if re-seeding
        // Schema::enableForeignKeyConstraints();

        // Check if there are enough users to create follows
        $userCount = User::count();

        if ($userCount < 2) {
            // If less than 2 users, follow relationships don't make sense.
            echo "Not enough users to create follow relationships. Please seed users first (e.g., run UserSeeder).\n";
            return;
        }

        // Get all existing users
        $users = User::all();

        // Define how many users each user should follow
        $followCount = 3;

        // Create follow relationships
        foreach ($users as $user) {
            // Determine the actual number of users this user can follow (max is total users - 1)
            $maxPossibleFollows = $userCount - 1;
            $actualFollowCount = min($followCount, $maxPossibleFollows);

            if ($actualFollowCount <= 0) {
                // Skip if no one else to follow (shouldn't happen if $userCount >= 2)
                continue;
            }

            // Get random users to follow (excluding self)
            // Use unique() to avoid trying to follow the same user twice in this loop for this user
            $followees = $users
                            ->where('id', '!=', $user->id) // Exclude self
                            ->random($actualFollowCount)
                            ->unique('id'); // Ensure uniqueness in the selected set

            foreach ($followees as $followee) {
                // Check if the follow relationship already exists to avoid duplicates
                // This is important if your 'follows' table migration has:
                // $table->unique(['follower_id', 'followee_id']);
                // Or if you might run the seeder multiple times.
                if (!Follow::where('follower_id', $user->id)->where('followee_id', $followee->id)->exists()) {
                     Follow::factory()->create([
                        'follower_id' => $user->id,
                        'followee_id' => $followee->id,
                        // 'created_at' and 'updated_at' will be set automatically
                    ]);
                } else {
                    // Optional: Log or handle case where follow already exists
                    // echo "Follow relationship already exists: {$user->id} -> {$followee->id}\n";
                }
            }
        }
    }
}