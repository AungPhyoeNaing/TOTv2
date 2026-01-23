<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class CommentController extends Controller
{
    /**
     * Display a listing of the comments for a specific post.
     */
    public function index(Post $post): JsonResponse
    {
        // Eager load user data for comments
        $comments = $post->comments()->with('user:id,name,avatar')->latest()->get();
        return response()->json($comments);
    }

    /**
     * Store a newly created comment for a specific post.
     */
    public function store(Request $request, Post $post): JsonResponse
    {
        $validatedData = $request->validate([
            'body' => 'required|string|max:1000',
        ]);

        $comment = $post->comments()->create([
            'user_id' => Auth::id(),
            'body' => $validatedData['body'],
        ]);

        // Load user for the response
        $comment->load('user:id,name,avatar');

        return response()->json($comment, 201);
    }

    /**
     * Update the specified comment.
     * Assumes comment ID is passed directly.
     */
    public function update(Request $request, Comment $comment): JsonResponse
    {
        // Authorization: Check if the comment belongs to the authenticated user
        if ($comment->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validatedData = $request->validate([
            'body' => 'required|string|max:1000',
        ]);

        $comment->update($validatedData);

        // Reload user data if it might have changed (unlikely here)
        $comment->load('user:id,name,avatar');

        return response()->json($comment);
    }

    /**
     * Remove the specified comment.
     * Assumes comment ID is passed directly.
     */
    public function destroy(Comment $comment): JsonResponse
    {
         // Authorization: Check if the comment belongs to the authenticated user
        if ($comment->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $comment->delete();

        return response()->json(null, 204); // 204 No Content
    }
}