<?php

namespace App\Http\Controllers\API;
use Illuminate\Support\Facades\Http;
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

        Http::post('http://localhost:3001/api/notify-login', [
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'is_following' => false, // default, since they're new to other users' lists
        ]
    ]);

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

    public function index(Request $request)
    {
        $currentUser = Auth::user(); // Get the currently authenticated user

        // Ensure the user is authenticated
        if (!$currentUser) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        
        $users = User::where('id', '!=', $currentUser->id)
                    ->with('followers') // Eager load followers
                    ->get();

        // Add 'is_following' status to each user object in the collection
        $users->transform(function ($user) use ($currentUser) {
           
            $user->is_following = $currentUser->isFollowing($user);
            
            return $user;
        });

        // Return the modified collection of users as a JSON response
        return response()->json($users, 200);
    }

    public function isMutualFollow(User $user, User $otherUser)
{
    // Get the currently authenticated user from the request/token
    $authenticatedUser = Auth::user();

    // Ensure the user is authenticated
    if (!$authenticatedUser) {
         return response()->json(['error' => 'Unauthenticated.'], 401);
    }

    // Authorization check: The authenticated user must be involved in the check.
    if ($authenticatedUser->id !== $user->id && $authenticatedUser->id !== $otherUser->id) {
        return response()->json(['error' => 'You are not authorized to check the follow status between these users.'], 403);
    }

    // Prevent checking if a user follows themselves
    if ($user->id === $otherUser->id) {
         return response()->json(['is_mutual_follow' => false]);
    }

    // --- CORRECTED COLUMN NAME ---
    // Use the actual column name from your 'follows' table (e.g., 'followee_id')
    $isUserFollowingOther = $user->following()->where('followee_id', $otherUser->id)->exists(); // Changed 'followed_user_id' to 'followee_id'
    $isOtherFollowingUser = $otherUser->following()->where('followee_id', $user->id)->exists(); // Changed 'followed_user_id' to 'followee_id'
    // --- END CORRECTION ---

    $isMutual = $isUserFollowingOther && $isOtherFollowingUser;

    return response()->json(['is_mutual_follow' => $isMutual]);
}
}