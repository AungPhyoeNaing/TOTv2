// database/migrations/xxxx_xx_xx_xxxxxx_create_reactions_table.php
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
        Schema::create('reactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('post_id')->constrained()->onDelete('cascade');
            $table->string('type'); // e.g., 'like', 'sad', 'angry'
            // Ensure a user can only react once per post with a specific type
            // If allowing only one reaction per user per post regardless of type, use unique(['user_id', 'post_id'])
            $table->unique(['user_id', 'post_id', 'type']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reactions');
    }
};