<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Post;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

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
            ->withCount(['reactions', 'comments', 'shares'])
            ->latest();

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

        return response()->json($posts);
    }

    /**
     * Get posts for a specific user.
     */
    public function getUserPosts(User $user)
    {
        $posts = Post::where('user_id', $user->id)
            ->with('user', 'sharedPost.user')
            ->orderBy('created_at', 'desc')
            ->get()
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
                return $post;
            });

        return response()->json($posts);
    }

    /**
     * Store a newly created resource in storage.
     * Supports optional media_url and media_type.
     * Requires at least body or media.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'body' => 'nullable|string|max:1000',
            'media_url' => 'nullable|url|max:500',
            'media_type' => 'nullable|in:image,audio,video',
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
        ]);

        // Load user for consistent response
        $post->load('user');

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
     */
    public function share(Post $post)
    {
        $sharedPostEntry = Auth::user()->posts()->create([
            'body' => '',
            'shared_post_id' => $post->id,
        ]);

        $sharedPostEntry->load([
            'user:id,name,email,avatar',
            'sharedPost.user:id,name,email,avatar'
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