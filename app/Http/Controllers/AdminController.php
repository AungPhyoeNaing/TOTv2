<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\UserReport; // Import the UserReport model

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
        // Use 'with' to eager load the related user models
        $reports = UserReport::with(['reportingUser:id,name,email', 'reportedUser:id,name,email']) // Only select id, name, email
                     ->orderBy('created_at', 'desc')
                     ->get();

        return view('admin_panel', compact('reports')); // Pass reports to the view
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

        $report = UserReport::findOrFail($id);
        $report->update(['status' => 'reviewed']);
        return back()->with('message', 'Report marked as reviewed.');
    }
}