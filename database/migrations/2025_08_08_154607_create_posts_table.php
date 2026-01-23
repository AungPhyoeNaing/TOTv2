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
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId(('user_id'))->constrained()->onDelete('cascade');
             $table->foreignId('shared_post_id')->nullable()->constrained('posts')->onDelete('set null');
            // Optional: Index for performance if querying shared posts frequently
            $table->index('shared_post_id');
            $table->text('body')->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
       Schema::table('posts', function (Blueprint $table) {
            $table->dropForeign(['shared_post_id']);
            $table->dropIndex(['shared_post_id']); // Drop index if created
            $table->dropColumn('shared_post_id');
        });
    }
};
