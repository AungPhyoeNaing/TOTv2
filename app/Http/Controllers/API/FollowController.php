<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;


use Illuminate\Http\Request;


class FollowController extends Controller
{
    /**
     * Follow a user.
     */
    public function follow(User $user)
    {
        // Prevent users from following themselves
        if (auth()->id() == $user->id) {
            return response()->json(['message' => 'You cannot follow yourself'], 400);
        }

        // Check if already following
        if (auth()->user()->isFollowing($user)) {
            return response()->json(['message' => 'You are already following this user'], 400);
        }

        auth()->user()->follow($user);

        return response()->json(['message' => 'Successfully followed user'], 200);
    }

    /**
     * Unfollow a user.
     */
    public function unfollow(User $user)
    {
        // Prevent users from unfollowing themselves
        if (auth()->id() == $user->id) {
            return response()->json(['message' => 'You cannot unfollow yourself'], 400);
        }

        // Check if not following
        if (!auth()->user()->isFollowing($user)) {
            return response()->json(['message' => 'You are not following this user'], 400);
        }

        auth()->user()->unfollow($user);

        return response()->json(['message' => 'Successfully unfollowed user'], 200);
    }

    /**
     * Get the followers of a user.
     */
    public function followers(User $user)
    {
        $followers = $user->followers()->paginate(20);
        
        // Add is_following status for each follower
        $followers->getCollection()->transform(function ($follower) {
            $follower->is_following = auth()->user()->isFollowing($follower);
            return $follower;
        });
        
        return response()->json($followers, 200);
    }

    /**
     * Get the users that a user is following.
     */
    public function following(User $user)
    {
        $following = $user->following()->paginate(20);
        
        // Add is_following status for each followed user
        $following->getCollection()->transform(function ($followedUser) {
            $followedUser->is_following = auth()->user()->isFollowing($followedUser);
            return $followedUser;
        });
        
        return response()->json($following, 200);
    }
}