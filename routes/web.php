<?php

// routes/web.php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\EmailTestController;
/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});

// Admin Authentication routes (These don't require the 'admin' middleware)
Route::get('/admin/login', [AdminController::class, 'showLoginForm'])->name('admin.login');
Route::post('/admin/login', [AdminController::class, 'login'])->name('admin.login.post');

// Admin Panel and related actions (These require the 'admin' middleware)
Route::middleware(['admin'])->group(function () {
    // Main Admin Panel
    Route::get('/admin/panel', [AdminController::class, 'showPanel'])->name('admin.panel');
    // Optional: You might also map the root /admin to the panel
    // Route::get('/admin', [AdminController::class, 'showPanel'])->name('admin.dashboard'); // If you prefer 'dashboard' name

    // Logout
    Route::post('/admin/logout', [AdminController::class, 'logout'])->name('admin.logout');
    // Or if using GET for logout (less secure but simpler for session clearing in this context):
    // Route::get('/admin/logout', [AdminController::class, 'logout'])->name('admin.logout');

    // Managing Users and Posts
    Route::delete('/admin/users/{id}', [AdminController::class, 'deleteUser'])->name('admin.delete-user');
    Route::delete('/admin/posts/{id}', [AdminController::class, 'deletePost'])->name('admin.delete-post');

    // Managing Reports
    Route::post('/admin/reports/{id}/review', [AdminController::class, 'markReportReviewed'])->name('admin.mark-report-reviewed');
    // Managing Password Reset Requests
    Route::post('/admin/password-reset/{id}/approve', [AdminController::class, 'approvePasswordReset'])->name('admin.approve-password-reset');
    Route::post('/admin/password-reset/{id}/reject', [AdminController::class, 'rejectPasswordReset'])->name('admin.reject-password-reset');
    Route::post('/admin/password-reset/{id}/send-code', [AdminController::class, 'sendPasswordResetCode'])->name('admin.send-password-reset-code');
    // NEW: Route for viewing and processing a specific request (Add this line)
    Route::get('/admin/password-reset/{id}/view', [AdminController::class, 'viewPasswordResetRequest'])->name('admin.view-password-reset-request');
});

// --- NEW: Routes for the actual password reset process (outside admin middleware) ---
// Route to show the password reset form (receives email and code via query params)
Route::get('/reset-password-page', [AdminController::class, 'showResetForm'])->name('password.reset.form');

// Route to handle the password reset submission
Route::post('/reset-password', [AdminController::class, 'resetPassword'])->name('password.reset');
// --- END NEW ROUTES ---

Route::get('/test-email', function () {
    return view('test-email');
})->name('test.email.form');

// Route to process the test request
Route::post('/test-email', [EmailTestController::class, 'sendTestEmail'])
    ->name('test.email.send');