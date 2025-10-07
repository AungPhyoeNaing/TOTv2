<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\UserReport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth; // Import Auth facade
use Illuminate\Validation\ValidationException; // Import ValidationException if needed

class UserReportController extends Controller
{
    /**
     * Submit a report for a user.
     * POST /api/submit-user-report
     */
    public function submitReport(Request $request)
    {
        // Validate the request data
        $request->validate([
            'reported_user_id' => 'required|exists:users,id', // Ensure the reported user exists
            'reported_user_name' => 'nullable|string|max:255', // Optional: name for display, but ID is the key
            'reason' => 'required|string|max:1000', // Reason must be provided
        ], [
            // Optional: Add custom validation messages
            'reported_user_id.exists' => 'The user you are trying to report does not exist.',
            'reason.required' => 'A reason for the report is required.',
        ]);

        // Get the authenticated user (the one submitting the report)
        $reportingUser = Auth::user();

        if (!$reportingUser) {
            // This should ideally be handled by a middleware like 'auth:sanctum'
            // If reached here, the user is not authenticated
            return response()->json(['error' => 'Unauthenticated.'], 401);
        }

        // Create a new report record
        $report = UserReport::create([
            'reporting_user_id' => $reportingUser->id, // Use the authenticated user's ID
            'reported_user_id' => $request->reported_user_id, // Use the reported user's ID from the request
            'reason' => $request->reason, // Use the reason from the request
            // 'status' defaults to 'pending' as defined in the migration/model
        ]);

        // Return a success response
        return response()->json([
            'message' => 'Your report has been submitted successfully. An admin will review it soon.',
            'report' => $report, // Optionally return the created report data
        ], 200); // 200 OK or 201 Created are both acceptable, 200 is fine for this
    }

    // Optional: Add methods to get reports for admin panel
    // public function getPendingReports(Request $request) { ... }
    // public function updateReportStatus(Request $request, $id) { ... }
}