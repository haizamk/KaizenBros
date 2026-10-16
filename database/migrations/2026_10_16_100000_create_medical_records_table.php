<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medical_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->restrictOnDelete();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->date('examination_date');
            $table->string('examination_type');
            $table->decimal('hemoglobin', 4, 1)->nullable();
            $table->decimal('potassium', 4, 2)->nullable();
            $table->decimal('phosphate', 4, 2)->nullable();
            $table->decimal('urea', 5, 1)->nullable();
            $table->decimal('creatinine', 7, 1)->nullable();
            $table->text('clinical_notes')->nullable();
            $table->timestamps();

            $table->index(['patient_id', 'examination_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medical_records');
    }
};
