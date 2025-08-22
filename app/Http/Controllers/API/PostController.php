<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Post;
use Illuminate\Support\Facades\Auth; // Import Auth facade

class PostController extends Controller
{
    /**
     * Display a listing of the resource.
     * Modified to include counts for reactions, comments, and shares,
     * and data for shared posts.
     */
     public function index()
    {
        $userId = Auth::id();

        $postsQuery = Post::with([
                'user:id,name,email,avatar',
                'sharedPost.user:id,name,email,avatar'
            ])
            // Keep the total counts
            ->withCount(['reactions', 'comments', 'shares'])
            ->latest();

        $posts = $postsQuery->get();

        // --- Add specific reaction type counts for each post ---
        // Use loadMissing to efficiently calculate counts if not already loaded
        // This avoids N+1 query issues.
        $posts->each(function ($post) {
            // Add specific counts as dynamic attributes
            // These will be serialized to JSON (e.g., likes_count, sads_count)
            $post->likes_count = $post->reactions->where('type', 'like')->count();
            $post->sads_count = $post->reactions->where('type', 'sad')->count();
            $post->angries_count = $post->reactions->where('type', 'angry')->count();
        });
        // --- End adding specific counts ---

        // --- Efficiently fetch and append user's reaction for all posts ---
        if ($userId) {
            $postIds = $posts->pluck('id')->toArray();

            // Fetch user reactions for these posts
            $userReactions = \App\Models\Reaction::where('user_id', $userId)
                                                ->whereIn('post_id', $postIds)
                                                ->pluck('type', 'post_id');

            // Append user's reaction type to each post
            $posts->each(function ($post) use ($userReactions) {
                // Add dynamic attribute 'user_reaction'
                // Laravel typically converts snake_case to camelCase in JSON
                $post->user_reaction = $userReactions->get($post->id); // Get type or null
            });
        } else {
            // Explicitly set user_reaction to null if not logged in
            $posts->each(function ($post) {
                $post->user_reaction = null;
            });
        }
        // --- End efficient fetch and append ---

        return response()->json($posts);
    }

    /**
     * Store a newly created resource in storage.
     * This method remains unchanged from your original working code,
     * just formatted slightly.
     */
    public function store(Request $request)
    {
        // Keep original validation
        $request->validate([
            'body' => 'required|string|max:1000'
        ]);

        // Keep original post creation logic
        $post = $request->user()->posts()->create([
            'body' => $request->body
        ]);

        // Keep original response, ensuring 'user' relationship is loaded
        return response()->json($post->load('user'), 201);
    }

    /**
     * Remove the specified resource from storage.
     * New method for deleting a post.
     */
    public function destroy(Post $post) // Uses route model binding for the {post} parameter
    {
        // Authorization: Check if the authenticated user is the owner of the post
        if ($post->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // If authorized, delete the post
        $post->delete();

        // Return a success response (204 No Content is standard for successful deletion)
        return response()->json(null, 204);
    }

    /**
     * Share a post.
     * Creates a new post referencing the original.
     */
    public function share(Post $post) // Uses route model binding for the {post} parameter
    {
        // Create a new post for the authenticated user
        $sharedPostEntry = Auth::user()->posts()->create([
            'body' => '', // You can set a default message or let the frontend handle it
            'shared_post_id' => $post->id, // Reference the original post
        ]);

        // Load the user relationship for the new post entry
        // and the shared post's data (including its user)
        // Using the same eager loading structure as index for consistency
        $sharedPostEntry->load([
            'user:id,name,email,avatar',
            'sharedPost.user:id,name,email,avatar'
        ]);

        return response()->json($sharedPostEntry, 201);
    }

    // If you have show, update methods, they can remain unchanged
    // unless you also want counts there or other modifications.

    /*
    public function show(Post $post)
    {
        // Example if you want counts and shared post data on the individual post view:
        $post->load([
                'user:id,name,email,avatar',
                'sharedPost.user:id,name,email,avatar'
            ])
            ->loadCount(['reactions', 'comments', 'shares']);

        return response()->json($post);
    }
    */

    /*
    // Example update (if exists) - keep original logic
    public function update(Request $request, Post $post)
    {
        if ($post->user_id !== Auth::id()) {
             return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'body' => 'sometimes|string|max:1000'
        ]);

        $post->update($request->only('body'));
        // Reload relationships if necessary
        $post->load([
            'user:id,name,email,avatar',
            'sharedPost.user:id,name,email,avatar'
        ]);
        return response()->json($post);
    }
    */
}