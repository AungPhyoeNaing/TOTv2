<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\PostController;

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

    Route::get('/posts', [PostController::class, 'index']);
    Route::post('/posts', [PostController::class, 'store']);
    
    // Follow routes
    Route::post('/follow/{user}', [App\Http\Controllers\API\FollowController::class, 'follow']);
    Route::post('/unfollow/{user}', [App\Http\Controllers\API\FollowController::class, 'unfollow']);
    Route::get('/followers/{user}', [App\Http\Controllers\API\FollowController::class, 'followers']);
    Route::get('/following/{user}', [App\Http\Controllers\API\FollowController::class, 'following']);

});