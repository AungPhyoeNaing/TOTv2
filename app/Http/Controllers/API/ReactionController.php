<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\Reaction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class ReactionController extends Controller
{
    public function getMyReaction(Post $post): JsonResponse
    {
        $userId = Auth::id();

        if (!$userId) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Find the reaction record for this user and this post
        // Select only the 'type' column for efficiency
        $reactionType = $post->reactions()
                             ->where('user_id', $userId)
                             ->value('type'); // value() returns the value of the column or null

        // Return the reaction type, or null if not found
        // Returning it in an object makes it easier to consume on the frontend
        return response()->json(['type' => $reactionType]);
    }
    /**
     * Toggle a reaction for the authenticated user on a specific post.
     * If the user already has this reaction type, it removes it.
     * If the user has a different reaction type, it replaces it (or adds if none).
     * Adjust logic based on whether you allow multiple types per user per post.
     */
    public function toggle(Request $request, Post $post): JsonResponse
    {
        $validatedData = $request->validate([
            'type' => 'required|string|in:like,sad,angry', // Validate allowed types
        ]);

        $userId = Auth::id();
        $requestedType = $validatedData['type'];

        // Check if the user already has *this specific type* of reaction on this post
        $existingReaction = $post->reactions()
                                ->where('user_id', $userId)
                                ->where('type', $requestedType)
                                ->first();

        if ($existingReaction) {
            // Reaction of this type exists, remove it
            $existingReaction->delete();
            // Return updated counts or just success message
            // Fetching updated counts might be slightly inefficient but ensures consistency
             $updatedCounts = [
                'reactions_count' => $post->reactions()->count(),
                'likes_count' => $post->reactions()->where('type', 'like')->count(),
                'sads_count' => $post->reactions()->where('type', 'sad')->count(),
                'angries_count' => $post->reactions()->where('type', 'angry')->count(),
            ];
            return response()->json([
                'message' => 'Reaction removed',
                'counts' => $updatedCounts
            ], 200);
        } else {
            // Reaction of this type does not exist, create it.
            // Option 1: Allow only one reaction type per user per post (remove others first)
            $post->reactions()->where('user_id', $userId)->delete();
            // Option 2: Allow multiple types per user per post (don't delete others)
            // Comment out the line above for Option 2.

            $newReaction = $post->reactions()->create([
                'user_id' => $userId,
                'type' => $requestedType,
            ]);

             $updatedCounts = [
                'reactions_count' => $post->reactions()->count(),
                'likes_count' => $post->reactions()->where('type', 'like')->count(),
                'sads_count' => $post->reactions()->where('type', 'sad')->count(),
                'angries_count' => $post->reactions()->where('type', 'angry')->count(),
            ];

            return response()->json([
                'reaction' => $newReaction,
                'counts' => $updatedCounts
            ], 201);
        }
    }

   
}