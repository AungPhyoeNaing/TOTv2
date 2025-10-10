<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\User; // Import the User model
use App\Models\Category; // Import the Category model
use Illuminate\Support\Str; // If you need Str for any text manipulation

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Post>
 */
class PostFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            // Use the User factory to get a valid user ID, or pick a random existing one
            // 'user_id' => User::factory(), // This would create a NEW user for each post
            'user_id' => User::inRandomOrder()->first()?->id ?? User::factory(), // Prefer existing user, create one if none exist yet
            'body' => fake()->paragraph(), // Generate a fake paragraph for the post body
            // Fetch a random existing category ID
            'category_id' => Category::inRandomOrder()->first()?->id, // This will be null if no categories exist
            // Prefer existing category, null if none exist
            // Add other fields your Post model might have, e.g., title
            // 'title' => fake()->sentence(),
            // 'created_at' & 'updated_at' are handled automatically by Laravel factories
        ];
    }
}