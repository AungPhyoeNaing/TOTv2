<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdminController;

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


// Admin routes
Route::get('/admin/login', [AdminController::class, 'showLoginForm'])->name('admin.login');
Route::post('/admin/login', [AdminController::class, 'login'])->name('admin.login.post');
Route::get('/admin/panel', [AdminController::class, 'showPanel'])->name('admin.panel')->middleware('admin'); // Optional: Add middleware
Route::post('/admin/logout', [AdminController::class, 'logout'])->name('admin.logout')->middleware('admin'); // Optional: Add middleware

// Optional: Route for marking reports reviewed
Route::patch('/admin/reports/{id}/review', [AdminController::class, 'markReportReviewed'])->name('admin.mark-report-reviewed')->middleware('admin');