// database/migrations/..._create_messages_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateMessagesTable extends Migration
{
    public function up()
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sender_id')->constrained('users'); // Assuming 'users' table
            $table->foreignId('recipient_id')->constrained('users'); // For direct messages
            // OR, if using chat rooms/conversations:
            // $table->foreignId('chat_id')->constrained('chats'); // Requires a 'chats' table
            $table->text('content');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('messages');
    }
}