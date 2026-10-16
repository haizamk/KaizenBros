<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chair_blocks', function (Blueprint $table) {
            $table->id();
            $table->string('chair_number', 8);
            $table->date('blocked_on');
            $table->string('reason', 32);
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['chair_number', 'blocked_on']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chair_blocks');
    }
};
