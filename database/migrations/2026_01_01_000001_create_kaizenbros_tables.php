<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations for KaizenBros Dialysis Centre (MySQL 8.x).
     */
    public function up(): void
    {
        // 1. Roles table
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50)->unique(); // 'ADMIN', 'NEPHROLOGIST', 'HEAD_NURSE', 'STAFF_NURSE', 'PATIENT'
            $table->string('display_name', 100);
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // 2. Users table (Authentication & core accounts)
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')->constrained('roles')->onDelete('restrict');
            $table->string('name', 150);
            $table->string('email', 150)->unique();
            $table->string('password');
            $table->string('phone', 25)->nullable()->index();
            $table->string('ic_number', 20)->nullable()->unique();
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_login_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['role_id', 'is_active']);
        });

        // 3. Dialysis Chairs table (12 physical stations)
        Schema::create('dialysis_chairs', function (Blueprint $table) {
            $table->id();
            $table->string('chair_number', 10)->unique(); // e.g. 'B-01' through 'B-12'
            $table->enum('bay', ['BAY_A', 'BAY_B', 'ISOLATION'])->default('BAY_A');
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 4. Dialysis Machines table (Fresenius Medical Care units)
        Schema::create('dialysis_machines', function (Blueprint $table) {
            $table->id();
            $table->string('serial_number', 50)->unique();
            $table->string('brand_model', 100); // 'Fresenius 4008S NG', 'Fresenius 5008S CorDiax'
            $table->foreignId('chair_id')->nullable()->constrained('dialysis_chairs')->onDelete('set null');
            $table->boolean('online_hdf_capable')->default(false);
            $table->enum('status', ['OPERATIONAL', 'IN_USE', 'MAINTENANCE'])->default('OPERATIONAL');
            $table->date('last_service_date')->nullable();
            $table->date('next_service_date')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 5. Patients table
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('patient_id_code', 20)->unique(); // e.g. 'P00123'
            $table->string('name', 150)->index();
            $table->string('ic_number', 20)->unique();
            $table->string('phone', 25)->index();
            $table->string('email', 150)->nullable();
            $table->unsignedTinyInteger('age');
            $table->enum('gender', ['LELAKI', 'PEREMPUAN']);
            $table->enum('blood_group', ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])->default('O+');
            $table->text('address')->nullable();
            $table->string('next_of_kin_name', 150);
            $table->string('next_of_kin_phone', 25);
            $table->string('next_of_kin_relation', 50);
            $table->decimal('dry_weight_kg', 5, 2);
            $table->decimal('latest_weight_kg', 5, 2)->nullable();
            $table->string('latest_bp', 15)->nullable();
            $table->enum('vascular_access', ['AVF', 'AVG', 'PERMACATH', 'CVC_TEMPORARY'])->default('AVF');
            $table->string('access_location', 100);
            $table->enum('sponsor', ['PERKESO_SOCSO', 'JPA_KWAP', 'ZAKAT_SELANGOR', 'BAITULMAL_MAIWP', 'NKF', 'INSURANS_SWASTA', 'PERSENDIRIAN'])->default('PERSENDIRIAN');
            $table->string('sponsor_ref_no', 100)->nullable();
            $table->enum('schedule_pattern', ['ISNIN_RABU_JUMAAT', 'SELASA_KHAMIS_SABTU'])->default('ISNIN_RABU_JUMAAT');
            $table->enum('preferred_shift', ['PAGI', 'TENGAHARI', 'PETANG'])->default('PAGI');
            $table->string('assigned_chair', 10)->default('B-01');
            $table->text('allergies')->nullable();
            $table->json('comorbidities')->nullable(); // e.g. ['Diabetes Mellitus', 'Hipertensi']
            $table->json('hepatitis_status')->nullable(); // {'hbs_ag': 'NEGATIF', 'anti_hcv': 'NEGATIF', 'hiv': 'NEGATIF'}
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['schedule_pattern', 'preferred_shift']);
        });

        // 6. Nurses table
        Schema::create('nurses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('staff_id_code', 20)->unique(); // 'SN-01'
            $table->string('name', 150);
            $table->string('title', 100); // 'Ketua Jururawat (Sister)' or 'Jururawat Hemodialisis'
            $table->string('nursing_board_no', 50); // Lembaga Jururawat Malaysia (LJM)
            $table->string('phone', 25);
            $table->string('assigned_bay', 20)->nullable();
            $table->enum('shift_today', ['PAGI', 'TENGAHARI', 'PETANG'])->default('PAGI');
            $table->boolean('is_on_duty')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // 7. Appointments table
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->onDelete('cascade');
            $table->date('appointment_date')->index();
            $table->enum('shift', ['PAGI', 'TENGAHARI', 'PETANG']);
            $table->time('scheduled_time');
            $table->foreignId('chair_id')->nullable()->constrained('dialysis_chairs')->onDelete('set null');
            $table->enum('status', ['SCHEDULED', 'ATTENDED', 'CANCELLED', 'NO_SHOW'])->default('SCHEDULED');
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->unique(['appointment_date', 'chair_id', 'shift'], 'uniq_apt_chair_slot');
        });

        // 8. Dialysis Sessions table (Core clinical treatment session)
        Schema::create('dialysis_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('session_code', 30)->unique();
            $table->foreignId('patient_id')->constrained('patients')->onDelete('restrict');
            $table->foreignId('chair_id')->constrained('dialysis_chairs')->onDelete('restrict');
            $table->foreignId('machine_id')->nullable()->constrained('dialysis_machines')->onDelete('set null');
            $table->date('scheduled_date')->index();
            $table->enum('scheduled_shift', ['PAGI', 'TENGAHARI', 'PETANG']);
            $table->string('scheduled_time', 15);
            $table->time('actual_start_time')->nullable();
            $table->time('actual_end_time')->nullable();
            $table->enum('status', ['BELUM_HADIR', 'SUDAH_HADIR', 'SEDANG_DIALISIS', 'SUDAH_SELESAI', 'BATAL', 'TIDAK_HADIR'])->default('BELUM_HADIR')->index();
            
            // Weights (kg)
            $table->decimal('pre_weight_kg', 5, 2)->nullable();
            $table->decimal('post_weight_kg', 5, 2)->nullable();
            $table->decimal('dry_weight_kg', 5, 2);
            $table->decimal('target_uf_litres', 4, 2)->nullable();
            $table->decimal('actual_uf_litres', 4, 2)->nullable();
            
            // Blood Pressure
            $table->string('pre_bp', 15)->nullable();
            $table->string('current_bp', 15)->nullable();
            $table->string('post_bp', 15)->nullable();
            
            $table->string('dialyzer_type', 50)->nullable();
            $table->string('anticoagulant', 100)->nullable();
            $table->string('nurse_in_charge', 150);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['scheduled_date', 'status']);
        });

        // 9. Vital Signs table (Pre, Hourly intra-dialysis, and Post)
        Schema::create('vital_signs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dialysis_session_id')->constrained('dialysis_sessions')->onDelete('cascade');
            $table->string('recorded_at', 20); // Time of recording e.g. '2:05 PM'
            $table->enum('phase', ['PRE_DIALYSIS', 'HOURLY', 'POST_DIALYSIS'])->default('HOURLY');
            $table->smallInteger('systolic_bp');
            $table->smallInteger('diastolic_bp');
            $table->smallInteger('pulse_rate');
            $table->smallInteger('respiratory_rate')->nullable();
            $table->decimal('temperature', 4, 1)->nullable();
            $table->smallInteger('uf_rate_ml_hr')->nullable();
            $table->smallInteger('blood_flow_rate_qb')->nullable();
            $table->smallInteger('dialysate_flow_rate_qd')->nullable();
            $table->smallInteger('venous_pressure')->nullable();
            $table->smallInteger('transmembrane_pressure')->nullable();
            $table->string('nurse_name', 150);
            $table->timestamps();

            $table->index(['dialysis_session_id', 'phase']);
        });

        // 10. Medications formulary
        Schema::create('medications', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150)->unique();
            $table->enum('type', ['DIALYSIS_IV', 'ORAL_DAILY', 'PHOSPHATE_BINDER', 'VITAMIN'])->default('ORAL_DAILY');
            $table->string('dosage', 100);
            $table->text('instructions')->nullable();
            $table->timestamps();
        });

        // 11. Patient Medications (Prescription / Regimen)
        Schema::create('patient_medications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->onDelete('cascade');
            $table->foreignId('medication_id')->constrained('medications')->onDelete('restrict');
            $table->string('dosage', 100);
            $table->string('frequency', 150);
            $table->enum('route', ['IV', 'ORAL', 'SUBCUTANEOUS'])->default('ORAL');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 12. Clinical Notes
        Schema::create('clinical_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->onDelete('cascade');
            $table->foreignId('dialysis_session_id')->nullable()->constrained('dialysis_sessions')->onDelete('set null');
            $table->string('author_name', 150);
            $table->string('author_role', 50);
            $table->enum('note_type', ['ROUTINE', 'INCIDENT', 'VASCULAR_ACCESS', 'DOCTOR_ORDER'])->default('ROUTINE');
            $table->text('content');
            $table->timestamps();
        });

        // 13. Actionable Alerts
        Schema::create('alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->onDelete('cascade');
            $table->foreignId('dialysis_session_id')->nullable()->constrained('dialysis_sessions')->onDelete('cascade');
            $table->string('chair_number', 10)->nullable();
            $table->enum('alert_type', ['BP_INCOMPLETE', 'POST_WEIGHT_MISSING', 'HIGH_PRE_WEIGHT', 'HYPOTENSION', 'MACHINE_ALERT']);
            $table->string('message', 255);
            $table->enum('severity', ['INFO', 'WARNING', 'CRITICAL'])->default('WARNING');
            $table->boolean('is_resolved')->default(false);
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['is_resolved', 'severity']);
        });

        // 14. Audit Logs (Mandatory requirement: user, action, record, timestamp, IP)
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('user_name', 150);
            $table->string('user_role', 50);
            $table->string('action', 100);
            $table->string('entity_type', 100);
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->text('details');
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();

            $table->index(['entity_type', 'entity_id']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('alerts');
        Schema::dropIfExists('clinical_notes');
        Schema::dropIfExists('patient_medications');
        Schema::dropIfExists('medications');
        Schema::dropIfExists('vital_signs');
        Schema::dropIfExists('dialysis_sessions');
        Schema::dropIfExists('appointments');
        Schema::dropIfExists('nurses');
        Schema::dropIfExists('patients');
        Schema::dropIfExists('dialysis_machines');
        Schema::dropIfExists('dialysis_chairs');
        Schema::dropIfExists('users');
        Schema::dropIfExists('roles');
    }
};
