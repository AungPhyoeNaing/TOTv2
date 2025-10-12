<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Exception;

class EmailTestController extends Controller
{
    public function sendTestEmail(Request $request)
    {
        // Validate the input from the form
        $request->validate([
            'recipient_email' => 'required|email|max:255',
        ]);

        // Get the recipient's email address from the form input
        $recipient = $request->input('recipient_email');
        
        // Define the welcome email content
        $subject = 'Welcome!';
        $body = "Hello future trendmate,

Welcome to **TOT (Trends Of TUM)**! We're thrilled to have you join the dedicated social network for TUM students.

Get ready to connect, share, and stay ahead of everything happening at TUM. Your journey starts now—dive in!

Best regards,
The TOT Team";

        try {
            // Attempt to send the welcome email
            Mail::raw($body, function ($message) use ($recipient, $subject) {
                $message->to($recipient) // Send to the user-provided address
                        ->subject($subject); // Use the welcome subject
            });

            // If no exception is thrown, the email was sent successfully.
            return back()->with('status', "Welcome email sent successfully to {$recipient}!");

        } catch (Exception $e) {
            // If an exception is thrown, sending failed.
            return back()->with('error', 'Email failed to send. Please check your mail configuration and the provided email address. Error: ' . $e->getMessage());
        }
    }
}