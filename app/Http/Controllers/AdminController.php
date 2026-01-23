<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\UserReport; // Import the UserReport model
use App\Models\User; // Import the User model
use App\Models\Post; // Import the Post model

class AdminController extends Controller
{
    // Hardcoded admin IDs and password
    private $validAdminIds = ['tot-admin-01', 'tot-admin-02', 'tot-admin-03', 'tot-admin-04', 'tot-admin-05'];
    private $adminPassword = 'totadmin2025***';

    /**
     * Show the admin login page.
     */
    public function showLoginForm()
    {
        return view('admin_login');
    }

    /**
     * Handle the admin login request.
     */
    public function login(Request $request)
    {
        $request->validate([
            'admin_id' => 'required|string',
            'password' => 'required|string',
        ]);

        $adminId = $request->admin_id;
        $password = $request->password;

        // Check if the provided credentials match the hardcoded ones
        if (in_array($adminId, $this->validAdminIds) && $password === $this->adminPassword) {
            // Login successful
            session(['admin_logged_in' => true, 'admin_id' => $adminId]); // Store admin status and ID in session
            return redirect()->route('admin.panel'); // Redirect to the admin panel
        } else {
            // Login failed
            return back()->withErrors(['error' => 'Invalid Admin ID or Password.'])->withInput();
        }
    }

    /**
     * Show the admin panel page.
     * Requires admin authentication.
     */
    public function showPanel()
    {
        // Check if admin is logged in using session
        if (!session('admin_logged_in')) {
            return redirect()->route('admin.login')->withErrors(['error' => 'Please log in first.']);
        }

        // Fetch user reports from the database, including the related reporting and reported user data
        $reports = UserReport::with(['reportingUser:id,name,email', 'reportedUser:id,name,email']) // Only select id, name, email
                     ->orderBy('created_at', 'desc')
                     ->get();

        // Fetch all users (or a paginated list if many)
        $users = User::all(); // Consider using ->paginate(10) for large user bases

        // Fetch all posts ordered by creation date, including the related user and counts for reactions and comments
        // Use the relationship names from the Post model: 'reactions' and 'comments'
        // Assume Reaction model has a 'type' column to distinguish like/sad/angry
        $posts = Post::with('user:id,name') // Only select id, name from user
                     ->withCount([
                         'reactions as likes_count' => function ($query) {
                             $query->where('type', 'like'); // Filter for 'like' reactions
                         },
                         'reactions as sads_count' => function ($query) {
                             $query->where('type', 'sad'); // Filter for 'sad' reactions
                         },
                         'reactions as angries_count' => function ($query) {
                             $query->where('type', 'angry'); // Filter for 'angry' reactions
                         },
                         'comments' // Count all comments
                     ])
                     ->orderBy('created_at', 'desc')
                     ->get();

        return view('admin_panel', compact('reports', 'users', 'posts')); // Pass reports, users, and posts to the view
    }

    /**
     * Logout the admin.
     */
    public function logout()
    {
        session()->forget(['admin_logged_in', 'admin_id']); // Remove admin session data
        return redirect()->route('admin.login')->with('message', 'Logged out successfully.');
    }

    // Optional: Method to mark a report as reviewed
    public function markReportReviewed($id)
    {
        if (!session('admin_logged_in')) {
            return redirect()->route('admin.login')->withErrors(['error' => 'Please log in first.']);
        }

        $report = UserReport::with(['reportingUser:id,name,email', 'reportedUser:id,name,email'])->findOrFail($id); // Ensure related data is loaded if needed in this method
        $report->update(['status' => 'reviewed']);
        return back()->with('message', 'Report marked as reviewed.');
    }

    /**
     * Delete a specific user.
     */
    public function deleteUser($id)
    {
        if (!session('admin_logged_in')) {
            return redirect()->route('admin.login')->withErrors(['error' => 'Please log in first.']);
        }

        // Find the user by ID, fail if not found
        $user = User::findOrFail($id);

        // Delete the user (this might cascade delete related posts, comments, etc., depending on your DB constraints)
        $user->delete();

        // Redirect back to the admin panel with a success message
        return redirect()->route('admin.panel')->with('message', "User {$user->name} (ID: {$user->id}) deleted successfully.");
    }

    /**
     * Delete a specific post.
     */
    public function deletePost($id)
    {
        if (!session('admin_logged_in')) {
            return redirect()->route('admin.login')->withErrors(['error' => 'Please log in first.']);
        }

        // Find the post by ID, fail if not found
        $post = Post::findOrFail($id);

        // Delete the post (this might cascade delete related reactions, comments, etc., depending on your DB constraints)
        $post->delete();

        // Redirect back to the admin panel with a success message
        return redirect()->route('admin.panel')->with('message', "Post (ID: {$post->id}) deleted successfully.");
    }
}