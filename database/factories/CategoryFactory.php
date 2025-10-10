<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Category; // Make sure to import the Category model

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Category>
 */
class CategoryFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<\Illuminate\Database\Eloquent\Model>
     */
    protected $model = Category::class; // Link the factory to the Category model

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        static $order = 1; // A static variable to create unique slugs based on creation order

        $name = $this->faker->unique()->word(); // Generate a unique word for the name

        return [
            'name' => $name,
            'slug' => $name . '_' . $order++, // Create a unique slug, e.g., "News_1", "Memes_2"
            // 'created_at' & 'updated_at' are handled automatically by Laravel factories
        ];
    }
}