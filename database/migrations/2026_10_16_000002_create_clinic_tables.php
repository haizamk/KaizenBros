<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->unique()->constrained()->nullOnDelete();
            $table->string('patient_id_code')->unique();
            $table->string('name');
            $table->string('ic_number');
            $table->string('gender');
            $table->unsignedTinyInteger('age');
            $table->string('phone');
            $table->string('email')->nullable();
            $table->string('address')->nullable();
            $table->decimal('dry_weight_kg', 5, 2);
            $table->string('vascular_access');
            $table->string('access_location');
            $table->string('sponsor');
            $table->string('schedule_pattern');
            $table->string('preferred_shift');
            $table->string('allergies')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('dialysis_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->restrictOnDelete();
            $table->string('chair_number');
            $table->date('scheduled_date');
            $table->string('scheduled_time');
            $table->string('shift');
            $table->string('status');
            $table->decimal('pre_weight_kg', 5, 2)->nullable();
            $table->decimal('post_weight_kg', 5, 2)->nullable();
            $table->string('pre_bp')->nullable();
            $table->string('post_bp')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->foreignId('nurse_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('nurse_notes')->nullable();
            $table->timestamps();

            $table->index(['scheduled_date', 'status']);
        });

        Schema::create('patient_medications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->string('medication_name');
            $table->string('dosage');
            $table->string('frequency');
            $table->string('route');
            $table->boolean('is_active')->default(true);
            $table->string('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('registrations', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->string('full_name');
            $table->string('ic_number');
            $table->string('phone_number');
            $table->string('email')->nullable();
            $table->string('gender');
            $table->string('address')->nullable();
            $table->text('medical_notes')->nullable();
            $table->string('nok_name')->nullable();
            $table->string('nok_phone')->nullable();
            $table->string('status')->default('BARU');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registrations');
        Schema::dropIfExists('patient_medications');
        Schema::dropIfExists('dialysis_sessions');
        Schema::dropIfExists('patients');
    }
};
