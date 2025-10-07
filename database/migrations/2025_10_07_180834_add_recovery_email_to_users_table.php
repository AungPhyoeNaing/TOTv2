<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('recovery_email')->unique()->nullable(); // Add the recovery_email column
            // If you want it to be required during registration, remove '->nullable()'
            // If you want it to be unique, add '->unique()'
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('recovery_email');
        });
    }
};