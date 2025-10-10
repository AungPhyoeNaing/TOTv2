<?php

namespace App\Http\Controllers\API;
use Illuminate\Support\Facades\Storage;
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
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                'unique:users',
                'ends_with:@tot.com', // Ensure email ends with @tot.com
            ],
            'recovery_email' => 'required|email|max:255', // Validate recovery email
            'password' => [
                'required',
                'string',
                'min:8', // Minimum length of 8
                'confirmed', // Must match password_confirmation field
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/', // At least one lowercase, one uppercase, one number, one special character
            ],
        ], [
            'password.regex' => 'The password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&).',
            'email.ends_with' => 'Email must be a valid @tot.com address.', // Custom message for @tot.com rule
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email, // Store the @tot.com email
            'recovery_email' => $request->recovery_email, // Store the recovery email
            'password' => Hash::make($request->password),
        ]);

        $token = $user->createToken('api-token')->plainTextToken;

        Http::post('http://localhost:3001/api/notify-login', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email, // Send the @tot.com email
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

     // Updated updateProfile method to use 'avatar' column
     public function updateProfile(Request $request)
    {
        // Get the authenticated user
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Validate the request data
        $request->validate([
            'name' => 'sometimes|string|max:255', // 'sometimes' means it's only validated if present
            'profile_picture' => 'sometimes|image|mimes:jpeg,png,jpg,gif,webp|max:2048', // Max 2MB - This is the form field name
        ]);

        $updateData = [];

        // Check if 'name' is provided in the request and is different
        if ($request->filled('name') && $request->name !== $user->name) {
            $updateData['name'] = $request->name;
        }

        // Check if 'profile_picture' is provided in the request
        if ($request->hasFile('profile_picture')) {
            $profilePicture = $request->file('profile_picture');

            // Validate the image (this is also done in rules above, but good practice here too)
            if (!$profilePicture->isValid()) {
                return response()->json(['message' => 'Invalid profile picture file.'], 422);
            }

            // Generate a unique filename
            $filename = time() . '_' . $user->id . '.' . $profilePicture->getClientOriginalExtension();

            // Define the directory to store profile pictures (adjust as needed)
            $directory = 'profile_pictures';

            // Store the file in the 'public' disk (or your preferred disk)
            $path = $profilePicture->storeAs($directory, $filename, 'public');

            // Construct the public URL for the stored image
            $publicUrl = url(Storage::url($path));

            // Add the new profile picture path/URL to the update data using the correct DB column name 'avatar'
            $updateData['avatar'] = $publicUrl; // Use 'avatar' here

            // Optional: Delete the old profile picture if it existed and wasn't a default
            // if ($user->avatar && !str_starts_with($user->avatar, 'http')) { // Check if it's a local path
            //     $oldPath = str_replace(Storage::url(''), '', $user->avatar); // Reverse the URL to get path
            //     if (Storage::disk('public')->exists($oldPath)) {
            //         Storage::disk('public')->delete($oldPath);
            //     }
            // }
        }


        // If no data to update was provided, return early
        if (empty($updateData)) {
            return response()->json(['message' => 'No changes provided.', 'user' => $user], 200);
        }

        // Update the user model with the validated data
        $user->update($updateData); // This will update 'name' and/or 'avatar'

        // Return the updated user data
        return response()->json([
            'message' => 'Profile updated successfully!',
            'user' => $user
        ], 200);
    }
}