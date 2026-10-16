<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nurse_applications', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->string('full_name');
            $table->string('ic_number');
            $table->string('phone_number');
            $table->string('email')->nullable();
            $table->string('nursing_board_no');
            $table->unsignedTinyInteger('years_experience')->nullable();
            $table->string('preferred_shift')->nullable();
            $table->text('notes')->nullable();
            $table->string('status')->default('BARU');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nurse_applications');
    }
};
