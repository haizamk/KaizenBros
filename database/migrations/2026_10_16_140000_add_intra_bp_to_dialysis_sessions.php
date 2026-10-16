<?php

use App\Support\DemoClinicHistory;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dialysis_sessions', function (Blueprint $table) {
            $table->string('intra_bp')->nullable()->after('pre_bp');
        });

        DemoClinicHistory::ensure();
    }

    public function down(): void
    {
        Schema::table('dialysis_sessions', function (Blueprint $table) {
            $table->dropColumn('intra_bp');
        });
    }
};
