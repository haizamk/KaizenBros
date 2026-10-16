<?php

namespace App\Console\Commands;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class ClearPatientData extends Command
{
    protected $signature = 'clinic:clear-patients {--force : Hapus data pesakit tanpa pengesahan}';

    protected $description = 'Hapus semua data pesakit dan kekalkan akaun jururawat serta pentadbir';

    public function handle(): int
    {
        if (! $this->option('force') && ! $this->confirm('Hapus semua data pesakit? Akaun jururawat dan pentadbir kekal.')) {
            $this->info('Tiada data dihapuskan.');

            return self::SUCCESS;
        }

        $driver = Schema::getConnection()->getDriverName();

        if ($driver !== 'sqlite') {
            DB::unprepared('DROP TRIGGER IF EXISTS medical_reports_prevent_delete');
            DB::unprepared('DROP TRIGGER IF EXISTS medical_records_prevent_delete');
        }

        $patientIds = User::query()->where('role', UserRole::Patient)->pluck('id');
        $emails = User::query()->where('role', UserRole::Patient)->pluck('email');

        DB::transaction(function () use ($patientIds, $emails): void {
            DB::table('patient_documents')->delete();
            DB::table('medical_reports')->delete();
            DB::table('medical_records')->delete();
            DB::table('dialysis_sessions')->delete();
            DB::table('patient_medications')->delete();
            DB::table('patients')->delete();
            DB::table('registrations')->delete();

            if ($emails->isNotEmpty()) {
                DB::table('password_reset_tokens')->whereIn('email', $emails)->delete();
            }

            if ($patientIds->isNotEmpty()) {
                DB::table('sessions')->whereIn('user_id', $patientIds)->delete();

                if (Schema::hasTable('passkeys')) {
                    DB::table('passkeys')->whereIn('user_id', $patientIds)->delete();
                }

                DB::table('users')->whereIn('id', $patientIds)->delete();
            }
        });

        Storage::disk('medical_reports')->deleteDirectory('pesakit');
        Storage::disk('patient_documents')->deleteDirectory('pesakit');
        Storage::disk('patient_documents')->deleteDirectory('permohonan');

        if ($driver !== 'sqlite') {
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

        $this->info('Data pesakit dihapuskan. Akaun jururawat dan pentadbir kekal.');

        return self::SUCCESS;
    }
}
