<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('medical_records', function (Blueprint $table) {
            $table->decimal('wbc', 5, 1)->nullable()->after('hemoglobin');
            $table->decimal('platelet', 6, 0)->nullable()->after('wbc');
            $table->decimal('egfr', 5, 1)->nullable()->after('creatinine');
            $table->decimal('calcium', 4, 2)->nullable()->after('phosphate');
            $table->decimal('sodium', 5, 1)->nullable()->after('potassium');
            $table->decimal('glucose', 4, 1)->nullable()->after('sodium');
            $table->decimal('hba1c', 4, 1)->nullable()->after('glucose');
            $table->decimal('cholesterol', 4, 2)->nullable()->after('hba1c');
            $table->decimal('ldl', 4, 2)->nullable()->after('cholesterol');
            $table->decimal('hdl', 4, 2)->nullable()->after('ldl');
            $table->decimal('triglycerides', 4, 2)->nullable()->after('hdl');
            $table->text('nephrologist_notes')->nullable()->after('clinical_notes');
            $table->foreignId('nephrologist_user_id')->nullable()->after('nephrologist_notes')->constrained('users')->nullOnDelete();
            $table->timestamp('nephrologist_signed_at')->nullable()->after('nephrologist_user_id');
        });
    }

    public function down(): void
    {
        Schema::table('medical_records', function (Blueprint $table) {
            $table->dropConstrainedForeignId('nephrologist_user_id');
            $table->dropColumn([
                'wbc',
                'platelet',
                'egfr',
                'calcium',
                'sodium',
                'glucose',
                'hba1c',
                'cholesterol',
                'ldl',
                'hdl',
                'triglycerides',
                'nephrologist_notes',
                'nephrologist_signed_at',
            ]);
        });
    }
};
