<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\PostController;
// --- Import the new controllers ---
use App\Http\Controllers\API\ReactionController;
use App\Http\Controllers\API\CommentController;
use App\Http\Controllers\API\MessageController;
use App\Http\Controllers\API\FollowController;
use App\Http\Controllers\API\UserReportController;
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

    Route::post('/user/update', [AuthController::class, 'updateProfile']);

    Route::get('/users/{user}/is-mutual-follow/{otherUser}', [AuthController::class, 'isMutualFollow']);

   
    Route::get('/posts', [PostController::class, 'index']);
    Route::get('/users/{user}/posts', [PostController::class, 'getUserPosts']);
    Route::post('/posts', [PostController::class, 'store']);
   
    Route::post('/posts/{post}/share', [PostController::class, 'share']); // Add this line
    Route::delete('/posts/{post}', [PostController::class, 'destroy']);


    Route::post('/media/upload', [App\Http\Controllers\API\MediaController::class, 'upload']);
    
    Route::post('/follow/{user}', [App\Http\Controllers\API\FollowController::class, 'follow']);
    Route::post('/unfollow/{user}', [App\Http\Controllers\API\FollowController::class, 'unfollow']);
    Route::get('/followers/{user}', [App\Http\Controllers\API\FollowController::class, 'followers']);
    Route::get('/following/{user}', [App\Http\Controllers\API\FollowController::class, 'following']);

    // Route to get the list of users for the follow feature
    Route::get('/users', [AuthController::class, 'index']);


    Route::post('/posts/{post}/reactions/toggle', [ReactionController::class, 'toggle']);
   
   
    Route::get('/posts/{post}/my-reaction', [ReactionController::class, 'getMyReaction']);
   
    Route::post('/posts/{post}/comments', [CommentController::class, 'store']);
  
    Route::get('/posts/{post}/comments', [CommentController::class, 'index']);
  
    Route::put('/comments/{comment}', [CommentController::class, 'update']); // Assumes {comment} ID is passed
    
    Route::delete('/comments/{comment}', [CommentController::class, 'destroy']); // Assumes {comment} ID is passed
  
    Route::post('/messages', [MessageController::class, 'store']);
    Route::get('/messages/{userId}', [MessageController::class, 'index']); // Get chat history with a user

     Route::post('/submit-user-report', [UserReportController::class, 'submitReport']);
});