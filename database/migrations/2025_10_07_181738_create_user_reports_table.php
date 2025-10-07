<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('user_reports', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('reporting_user_id'); // ID of the user who submitted the report
            $table->unsignedBigInteger('reported_user_id'); // ID of the user being reported
            $table->text('reason'); // Reason for the report
            $table->enum('status', ['pending', 'reviewed', 'action_taken'])->default('pending'); // Status of the report
            $table->timestamps(); // created_at and updated_at

            // Optional: Add foreign key constraints if you have users table
            // $table->foreign('reporting_user_id')->references('id')->on('users')->onDelete('cascade');
            // $table->foreign('reported_user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_reports');
    }
};