<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patient_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('registration_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('patient_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('disk');
            $table->string('path');
            $table->string('original_name');
            $table->string('mime');
            $table->unsignedBigInteger('size');
            $table->string('category');
            $table->timestamps();
        });

        Schema::create('medical_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->restrictOnDelete();
            $table->foreignId('medical_record_id')->unique()->constrained()->restrictOnDelete();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('disk');
            $table->string('path');
            $table->string('original_name');
            $table->string('mime');
            $table->unsignedBigInteger('size');
            $table->timestamps();
        });

        if (Schema::getConnection()->getDriverName() !== 'sqlite') {
            DB::unprepared(<<<'SQL'
                CREATE TRIGGER medical_records_prevent_delete
                BEFORE DELETE ON medical_records
                FOR EACH ROW
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Rekod darah tidak boleh dipadam.'
            SQL);
            DB::unprepared(<<<'SQL'
                CREATE TRIGGER medical_reports_prevent_delete
                BEFORE DELETE ON medical_reports
                FOR EACH ROW
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Laporan perubatan tidak boleh dipadam.'
            SQL);
        }
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'sqlite') {
            DB::unprepared('DROP TRIGGER IF EXISTS medical_reports_prevent_delete');
            DB::unprepared('DROP TRIGGER IF EXISTS medical_records_prevent_delete');
        }

        Schema::dropIfExists('medical_reports');
        Schema::dropIfExists('patient_documents');
    }
};
