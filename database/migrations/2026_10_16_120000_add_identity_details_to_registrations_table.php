<?php

use App\Support\MalaysianIdentityCard;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->date('birth_date')->nullable()->after('gender');
            $table->unsignedTinyInteger('age_years')->nullable()->after('birth_date');
            $table->unsignedTinyInteger('age_months')->nullable()->after('age_years');
            $table->string('patient_category')->nullable()->after('address');
            $table->string('nok_relationship')->nullable()->after('nok_name');
            $table->string('nok_email')->nullable()->after('nok_phone');
            $table->foreignId('reviewed_by')->nullable()->after('status')->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable()->after('reviewed_by');
        });

        DB::table('registrations')->orderBy('id')->each(function (object $row): void {
            $parsed = MalaysianIdentityCard::parse($row->ic_number);

            if (! $parsed['valid']) {
                return;
            }

            DB::table('registrations')->where('id', $row->id)->update([
                'birth_date' => $parsed['birth_date'],
                'age_years' => $parsed['years'],
                'age_months' => $parsed['months'],
                'gender' => $parsed['gender'],
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('registrations', function (Blueprint $table) {
            $table->dropConstrainedForeignId('reviewed_by');
            $table->dropColumn([
                'birth_date',
                'age_years',
                'age_months',
                'patient_category',
                'nok_relationship',
                'nok_email',
                'reviewed_at',
            ]);
        });
    }
};
