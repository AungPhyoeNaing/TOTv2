<?php

namespace App\Http\Controllers\API;

use Illuminate\Support\Facades\Hash;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Auth; // Import Auth facade

class AuthController extends Controller
{
    /**
     * Register a new user.
     */
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    /**
     * Log in an existing user.
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            // If credentials are incorrect, throw a validation exception
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    /**
     * Log out the authenticated user.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully'], 200);
    }

    /**
     * Display a listing of users (excluding the authenticated user)
     * and include the follow status for the current user.
     * This supports the follow/unfollow feature in the frontend.
     */
    public function index(Request $request)
    {
        $currentUser = Auth::user(); // Get the currently authenticated user

        // Ensure the user is authenticated
        if (!$currentUser) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Fetch all users except the current authenticated user
        // The 'followers' relationship is eager loaded for potential future use or optimization
        $users = User::where('id', '!=', $currentUser->id)
                    ->with('followers') // Eager load followers
                    ->get();

        // Add 'is_following' status to each user object in the collection
        $users->transform(function ($user) use ($currentUser) {
            // Use the isFollowing method defined in your User model
            // This checks if the $currentUser is following this particular $user
            $user->is_following = $currentUser->isFollowing($user);
            // You could also add followers count if needed on the list page:
            // $user->followers_count = $user->followers->count();
            return $user;
        });

        // Return the modified collection of users as a JSON response
        return response()->json($users, 200);
    }
}