<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\PostController;
// --- Import the new controllers ---
use App\Http\Controllers\API\ReactionController;
use App\Http\Controllers\API\CommentController;
// --- End new imports ---

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/user', function (Request $request){
        return $request->user();
    });

    // --- Existing Post Routes ---
    Route::get('/posts', [PostController::class, 'index']);
    Route::post('/posts', [PostController::class, 'store']);
    // --- Add the new Share Route ---
    Route::post('/posts/{post}/share', [PostController::class, 'share']); // Add this line
    Route::delete('/posts/{post}', [PostController::class, 'destroy']);
    // --- End Existing & New Post Routes ---

    // --- Follow routes ---
    Route::post('/follow/{user}', [App\Http\Controllers\API\FollowController::class, 'follow']);
    Route::post('/unfollow/{user}', [App\Http\Controllers\API\FollowController::class, 'unfollow']);
    Route::get('/followers/{user}', [App\Http\Controllers\API\FollowController::class, 'followers']);
    Route::get('/following/{user}', [App\Http\Controllers\API\FollowController::class, 'following']);

    // Route to get the list of users for the follow feature
    Route::get('/users', [AuthController::class, 'index']);


    // --- Add New Reaction Routes ---
    // Toggle a reaction (e.g., Like, Sad, Angry) for a post
    Route::post('/posts/{post}/reactions/toggle', [ReactionController::class, 'toggle']);
    // If you decide you need separate add/remove endpoints later:
    // Route::post('/posts/{post}/reactions', [ReactionController::class, 'store']);
    // Route::delete('/posts/{post}/reactions/{reaction}', [ReactionController::class, 'destroy']); // Needs specific reaction ID or lookup
    // --- End Reaction Routes ---

    // Get the current user's reaction for a specific post
    Route::get('/posts/{post}/my-reaction', [ReactionController::class, 'getMyReaction']);
    // --- End new route ---

    // If you decide you need separate add/remove endpoints later:
    // Route::post('/posts/{post}/reactions', [ReactionController::class, 'store']);
    // Route::delete('/posts/{post}/reactions/{reaction}', [ReactionController::class, 'destroy']);

    // --- Add New Comment Routes ---
    // Add a comment to a post
    Route::post('/posts/{post}/comments', [CommentController::class, 'store']);
    // Get comments for a post
    Route::get('/posts/{post}/comments', [CommentController::class, 'index']);
    // Update a specific comment (ensure auth check in controller)
    Route::put('/comments/{comment}', [CommentController::class, 'update']); // Assumes {comment} ID is passed
    // Delete a specific comment (ensure auth check in controller)
    Route::delete('/comments/{comment}', [CommentController::class, 'destroy']); // Assumes {comment} ID is passed
    // --- End Comment Routes ---

});