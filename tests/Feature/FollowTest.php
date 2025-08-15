<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Follow;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FollowTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that a user can follow another user.
     */
    public function test_user_can_follow_another_user()
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $response = $this->actingAs($user1, 'sanctum')
            ->postJson("/api/follow/{$user2->id}");

        $response->assertStatus(200);
        $this->assertDatabaseHas('follows', [
            'follower_id' => $user1->id,
            'followee_id' => $user2->id,
        ]);
    }

    /**
     * Test that a user can unfollow another user.
     */
    public function test_user_can_unfollow_another_user()
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        
        // First follow the user
        $follow = Follow::factory()->create([
            'follower_id' => $user1->id,
            'followee_id' => $user2->id,
        ]);

        $response = $this->actingAs($user1, 'sanctum')
            ->postJson("/api/unfollow/{$user2->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('follows', [
            'follower_id' => $user1->id,
            'followee_id' => $user2->id,
        ]);
    }

    /**
     * Test that a user cannot follow themselves.
     */
    public function test_user_cannot_follow_themselves()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/follow/{$user->id}");

        $response->assertStatus(400);
    }

    /**
     * Test that followers can be retrieved.
     */
    public function test_user_followers_can_be_retrieved()
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        
        // Create follow relationship
        Follow::factory()->create([
            'follower_id' => $user1->id,
            'followee_id' => $user2->id,
        ]);

        $response = $this->actingAs($user1, 'sanctum')
            ->getJson("/api/followers/{$user2->id}");

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'id' => $user1->id,
            'name' => $user1->name,
        ]);
    }

    /**
     * Test that following can be retrieved.
     */
    public function test_user_following_can_be_retrieved()
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        
        // Create follow relationship
        Follow::factory()->create([
            'follower_id' => $user1->id,
            'followee_id' => $user2->id,
        ]);

        $response = $this->actingAs($user1, 'sanctum')
            ->getJson("/api/following/{$user1->id}");

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'id' => $user2->id,
            'name' => $user2->name,
        ]);
    }
}