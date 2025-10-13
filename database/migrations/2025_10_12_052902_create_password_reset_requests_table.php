<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('password_reset_requests', function (Blueprint $table) {
            $table->id();
            $table->string('email'); // The @tot.com email address submitted
            $table->string('recovery_email'); // The recovery email submitted
            $table->string('account_creation_date')->nullable(); // Approximate date provided
            $table->text('message')->nullable(); // Additional message provided
            // Change: Add 'code_sent' to the enum values
            $table->enum('status', ['pending', 'approved', 'rejected', 'code_sent'])->default('pending'); // Status of the request
            // Change: Use string instead of foreignId/constrained
            $table->string('admin_id', 255)->nullable(); // Store the string admin ID from session (e.g., 'tot-admin-02')
            $table->timestamp('processed_at')->nullable(); // Timestamp when processed
            // NEW: Columns for the 6-digit verification code and its expiry
            $table->string('verification_code', 6)->nullable();
            $table->timestamp('verification_code_expires_at')->nullable();
            $table->timestamps(); // created_at, updated_at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::dropIfExists('password_reset_requests');
    }
};