<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\UserReport; // Import the UserReport model
use App\Models\User; // Import the User model
use App\Models\Post; // Import the Post model
use App\Models\PasswordResetRequest; // Import the PasswordResetRequest model
use Illuminate\Support\Facades\Mail;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash; // Import Hash facade for password hashing

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

        // Fetch password reset requests
        $passwordRequests = PasswordResetRequest::orderBy('created_at', 'desc')->get(); // Order by newest first

        return view('admin_panel', compact('reports', 'users', 'posts', 'passwordRequests')); // Pass reports, users, posts, and passwordRequests to the view
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
    public function markReportReviewed(Request $request, $id) // Add Request $request parameter
    {
        // Check if admin is logged in using session
        if (!session('admin_logged_in')) {
            // Return JSON error for AJAX
            return response()->json(['error' => 'Please log in first.'], 401);
        }

        // Find the report by ID, fail if not found
        $report = UserReport::findOrFail($id); // No need for with() here if just updating status

        // Update the report's status
        $report->update(['status' => 'reviewed']);

        // Return JSON success response for AJAX
        return response()->json(['message' => 'Report marked as reviewed successfully.', 'report_id' => $id], 200);
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

    /**
     * Approve a password reset request.
     */
    public function approvePasswordReset($id)
    {
        if (!session('admin_logged_in')) {
            return redirect()->route('admin.login')->withErrors(['error' => 'Please log in first.']);
        }

        $request = PasswordResetRequest::findOrFail($id);
        if ($request->status !== 'pending') {
            return back()->withErrors(['error' => 'Request is not pending.']);
        }

        $request->update([
            'status' => 'approved',
            'admin_id' => session('admin_id'), // This now stores the string 'tot-admin-XX'
            'processed_at' => now(),
        ]);

        // Optionally, send an email to the user's recovery email here
        // Example: Mail::to($request->recovery_email)->send(new PasswordResetApprovedMail($request));

        return redirect()->route('admin.panel')->with('message', 'Password reset request approved.');
    }

    /**
     * Show the page to view and process a specific password reset request.
     * Requires admin authentication.
     */
    public function viewPasswordResetRequest($id)
    {
        // Check if admin is logged in using session
        if (!session('admin_logged_in')) {
            return redirect()->route('admin.login')->withErrors(['error' => 'Please log in first.']);
        }

        // Find the specific password reset request by ID
        $request = PasswordResetRequest::with('user')->findOrFail($id); // Assuming a 'user' relationship exists, optional

        // Return the new Blade view, passing the request data
        return view('admin_process_password_request', compact('request'));
    }

    /**
     * Generate a code, save it with the request, and send an email.
     * Requires admin authentication.
     */
    public function sendPasswordResetCode(Request $request, $id)
    {
        // Check if admin is logged in using session
        if (!session('admin_logged_in')) {
            return response()->json(['error' => 'Please log in first.'], 401); // Return JSON for potential AJAX
        }

        // Find the specific password reset request by ID
        $passwordRequest = PasswordResetRequest::findOrFail($id);

        // Check if the request is still pending before proceeding
        if ($passwordRequest->status !== 'pending') {
            return back()->withErrors(['error' => 'Request is not pending and cannot be processed.']);
        }

        // Generate a unique 6-digit code (ensure uniqueness in DB)
        $code = rand(100000, 999999);
        // It's good practice to ensure uniqueness, potentially loop if needed or use a unique DB constraint
        // For simplicity here, assuming rand is sufficient or DB handles uniqueness if needed later.
        $expiresAt = now()->addHours(24); // Expires in 24 hours

        // Update the request record with the code and expiry
        $passwordRequest->update([
            'verification_code' => $code,
            'verification_code_expires_at' => $expiresAt,
            'status' => 'code_sent', // This should work now that the enum includes 'code_sent'
            'admin_id' => session('admin_id'), // Optionally log which admin triggered this
            'processed_at' => now(), // Mark as processed when code is sent
        ]);

        // Prepare the email content
        // IMPORTANT: Update the resetLink to point to your actual password reset page route
        $resetLink = route('password.reset.form', ['email' => $passwordRequest->email, 'code' => $code]);
        $subject = 'Your Password Reset Code for TOT';
        $body = "Hello,

A password reset request was made for your TOT account ({$passwordRequest->email}).

Your verification code is: **{$code}**
This code is valid for 24 hours.

Please use this code on the password reset page to set a new password.
If you did not request this, please ignore this email.

Link (if supported by email clients): {$resetLink}

Best regards,
The TOT Team";

        // Send the email using Laravel's Mail facade
        try {
            Mail::raw($body, function ($message) use ($passwordRequest, $subject) {
                $message->to($passwordRequest->recovery_email) // Send to the recovery email provided in the request
                        ->subject($subject);
            });

            // If the code reaches here, it means the email was likely accepted by the mail server.
            // Note: This doesn't guarantee final delivery, just that Laravel handed it off successfully.
            // Return success response (JSON is good for AJAX calls if you plan to make it async later)
            return response()->json([
                'message' => 'Verification code generated and sent successfully!',
                'request_id' => $passwordRequest->id,
                'code' => $code, // Potentially useful if you want to display it on the page after sending
                'expires_at' => $expiresAt->format('Y-m-d H:i:s'),
                'recovery_email' => $passwordRequest->recovery_email
            ], 200);

        } catch (Exception $e) { // Catch any exception during the sending process
            // Log the error
            Log::error('Failed to send password reset email: ' . $e->getMessage());

            // If sending failed, it's good practice to revert the status update made earlier
            // or mark it with a different status like 'code_generation_failed' or 'code_sent_failed'
            $passwordRequest->update(['status' => 'pending']); // Revert status or set to a failed state

            // Return error response
            return response()->json(['error' => 'Failed to send email: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Reject a password reset request.
     */
    public function rejectPasswordReset($id)
    {
        if (!session('admin_logged_in')) {
            return redirect()->route('admin.login')->withErrors(['error' => 'Please log in first.']);
        }

        $request = PasswordResetRequest::findOrFail($id);
        if ($request->status !== 'pending') {
            return back()->withErrors(['error' => 'Request is not pending.']);
        }

        $request->update([
            'status' => 'rejected',
            'admin_id' => session('admin_id'), // This now stores the string 'tot-admin-XX'
            'processed_at' => now(),
        ]);

        // Optionally, send an email to the user's recovery email here
        // Example: Mail::to($request->recovery_email)->send(new PasswordResetRejectedMail($request));

        return redirect()->route('admin.panel')->with('message', 'Password reset request rejected.');
    }

    // --- NEW METHODS FOR PASSWORD RESET FLOW ---

    /**
     * Show the password reset form page.
     * This page receives the email and code via query parameters.
     */
    public function showResetForm(Request $request)
    {
        $email = $request->query('email');
        $code = $request->query('code');

        // Optional: Validate presence of email and code here if needed before showing the form
        // You could also pre-validate the code against the database here, but it's often done on submission.

        return view('reset-password-page', compact('email', 'code'));
    }

    /**
     * Handle the password reset request.
     * Validates the code and updates the user's password.
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email', // Validate email exists in users table
            'code' => 'required|string|size:6', // Validate code format
            'password' => 'required|string|min:8|confirmed', // Validate new password
        ]);

        $email = $request->email;
        $code = $request->code;
        $newPassword = $request->password;

        // Find the password reset request record
        $resetRequest = PasswordResetRequest::where('email', $email)
                                            ->where('verification_code', $code)
                                            ->where('verification_code_expires_at', '>', now())
                                            ->first();

        if (!$resetRequest) {
            return back()->withErrors(['code' => 'Invalid or expired verification code.']);
        }

        // Find the user
        $user = User::where('email', $email)->first();

        if (!$user) {
            // This should ideally not happen if the email exists in the request table
            Log::warning("User not found for email in reset request: {$email}");
            return back()->withErrors(['email' => 'User associated with this email not found.']);
        }

        // Update the user's password
        $user->password = Hash::make($newPassword); // Hash the new password
        $user->save();

        // Invalidate the used code (e.g., delete the request record)
        $resetRequest->delete();

        // Optionally, log the user in automatically here
        // Auth::login($user);

         return redirect('https://www.totumdy.com');
    }

    // --- END NEW METHODS ---

}