<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Post;
use App\Models\Category; // Import the Category model
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class PostController extends Controller
{
    /**
     * Display a listing of the resource.
     * Modified to include counts for reactions, comments, and shares,
     * data for shared posts, and category filtering.
     */
    public function index(Request $request) // Add Request parameter
    {
        $userId = Auth::id();

        // Build the query, including relationships and counts
        $postsQuery = Post::with([
                'user:id,name,email,avatar',
                'sharedPost.user:id,name,email,avatar',
                'category:id,name' // Eager load the category relationship
            ])
            ->withCount(['reactions', 'comments', 'shares'])
            ->latest();

        // Apply category filter if provided
        $categoryNames = $request->input('category_names'); // Expecting an array like ['News', 'Memes']
        $categoryIds = $request->input('category_ids');     // Or an array of IDs like [1, 2]

        if ($categoryNames && is_array($categoryNames) && !empty($categoryNames)) {
            // Find category IDs based on names
            $validCategoryIds = Category::whereIn('name', $categoryNames)->pluck('id')->toArray();
            $postsQuery->whereIn('category_id', $validCategoryIds);
        } elseif ($categoryIds && is_array($categoryIds) && !empty($categoryIds)) {
            // Validate that category IDs exist (optional but recommended)
            $validCategoryIds = Category::whereIn('id', $categoryIds)->pluck('id')->toArray();
            // Note: If $validCategoryIds count differs from $categoryIds count, some IDs were invalid.
            // You might want to handle this case (e.g., return an error, log it).
            $postsQuery->whereIn('category_id', $validCategoryIds);
        }
        // If neither 'category_names' nor 'category_ids' are provided, or if 'all' is implicitly selected,
        // the query will return posts from all categories (or no specific category filter is applied here).
        // You might want logic to explicitly handle an 'All' selection if it comes from the frontend as a specific value.

        $posts = $postsQuery->get();

        // --- Add specific reaction type counts for each post ---
        $posts->each(function ($post) {
            $post->likes_count = $post->reactions->where('type', 'like')->count();
            $post->sads_count = $post->reactions->where('type', 'sad')->count();
            $post->angries_count = $post->reactions->where('type', 'angry')->count();
        });
        // --- End adding specific counts ---

        // --- Efficiently fetch and append user's reaction for all posts ---
        if ($userId) {
            $postIds = $posts->pluck('id')->toArray();

            $userReactions = \App\Models\Reaction::where('user_id', $userId)
                                                ->whereIn('post_id', $postIds)
                                                ->pluck('type', 'post_id');

            $posts->each(function ($post) use ($userReactions) {
                $post->user_reaction = $userReactions->get($post->id);
            });
        } else {
            $posts->each(function ($post) {
                $post->user_reaction = null;
            });
        }
        // --- End efficient fetch and append ---

        // Optionally, append the category name directly to the post object for easier frontend access
        // This is redundant if 'category' relationship is eager-loaded, but useful if you only need the name.
        // $posts->each(function ($post) {
        //     $post->category_name = $post->category ? $post->category->name : 'Uncategorized';
        // });

        return response()->json($posts);
    }

    /**
     * Get posts for a specific user.
     * Potentially add category filtering here too if needed for user-specific feeds.
     */
    public function getUserPosts(User $user, Request $request) // Add Request parameter
    {
        $postsQuery = Post::where('user_id', $user->id)
            ->with('user', 'sharedPost.user', 'category:id,name') // Include category
            ->orderBy('created_at', 'desc');

        // Apply category filter for user's posts if provided
        $categoryNames = $request->input('category_names');
        $categoryIds = $request->input('category_ids');

        if ($categoryNames && is_array($categoryNames) && !empty($categoryNames)) {
            $validCategoryIds = Category::whereIn('name', $categoryNames)->pluck('id')->toArray();
            $postsQuery->whereIn('category_id', $validCategoryIds);
        } elseif ($categoryIds && is_array($categoryIds) && !empty($categoryIds)) {
            $validCategoryIds = Category::whereIn('id', $categoryIds)->pluck('id')->toArray();
            $postsQuery->whereIn('category_id', $validCategoryIds);
        }

        $posts = $postsQuery->get()
            ->map(function ($post) {
                // Attach reaction counts
                $post->likes_count = $post->reactions->where('type', 'like')->count();
                $post->sads_count = $post->reactions->where('type', 'sad')->count();
                $post->angries_count = $post->reactions->where('type', 'angry')->count();
                $post->reactions_count = $post->reactions->count();
                $post->comments_count = $post->comments->count();
                $post->shares_count = $post->shares->count();

                // Attach current user's reaction (if authenticated)
                if (auth()->check()) {
                    $userReaction = $post->reactions->firstWhere('user_id', auth()->id());
                    $post->user_reaction = $userReaction ? $userReaction->type : null;
                }

                // ✅ media_url and media_type are DB columns → auto-included in JSON
                // Category data is included via 'with' above
                return $post;
            });

        return response()->json($posts);
    }

    /**
     * Store a newly created resource in storage.
     * Supports optional media_url and media_type.
     * Requires at least body or media.
     * Now also supports category_id.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'body' => 'nullable|string|max:1000',
            'media_url' => 'nullable|url|max:500',
            'media_type' => 'nullable|in:image,audio,video',
            'category_id' => 'nullable|exists:categories,id', // Validate category_id exists in categories table
        ]);

        // Ensure at least body or media is provided
        if (empty($validated['body']) && empty($validated['media_url'])) {
            return response()->json([
                'message' => 'Post must have either body text or media.'
            ], 422);
        }

        $post = $request->user()->posts()->create([
            'body' => $validated['body'] ?? null,
            'media_url' => $validated['media_url'] ?? null,
            'media_type' => $validated['media_type'] ?? null,
            'category_id' => $validated['category_id'] ?? null, // Assign category if provided
        ]);

        // Load user and category for consistent response
        $post->load('user', 'category');

        // Initialize counts for immediate UI consistency (like in index)
        $post->likes_count = 0;
        $post->sads_count = 0;
        $post->angries_count = 0;
        $post->reactions_count = 0;
        $post->comments_count = 0;
        $post->shares_count = 0;
        $post->user_reaction = null;

        return response()->json($post, 201);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Post $post)
    {
        if ($post->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $post->delete();
        return response()->json(null, 204);
    }

    /**
     * Share a post.
     * Creates a new post referencing the original.
     * The shared post will inherit the category of the original post.
     */
    public function share(Post $post)
    {
        $sharedPostEntry = Auth::user()->posts()->create([
            'body' => '',
            'shared_post_id' => $post->id,
            'category_id' => $post->category_id, // Inherit the category from the original post being shared
        ]);

        $sharedPostEntry->load([
            'user:id,name,email,avatar',
            'sharedPost.user:id,name,email,avatar',
            'category:id,name' // Load the inherited category
        ]);

        // Initialize counts for shared post entry
        $sharedPostEntry->likes_count = 0;
        $sharedPostEntry->sads_count = 0;
        $sharedPostEntry->angries_count = 0;
        $sharedPostEntry->reactions_count = 0;
        $sharedPostEntry->comments_count = 0;
        $sharedPostEntry->shares_count = 0;
        $sharedPostEntry->user_reaction = null;

        return response()->json($sharedPostEntry, 201);
    }
}