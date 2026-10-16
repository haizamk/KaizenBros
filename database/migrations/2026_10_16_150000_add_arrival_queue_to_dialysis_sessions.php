<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dialysis_sessions', function (Blueprint $table) {
            $table->unsignedSmallInteger('queue_number')->nullable()->after('patient_id');
            $table->timestamp('arrived_at')->nullable()->after('status');
            $table->timestamp('called_at')->nullable()->after('arrived_at');
        });

        Schema::table('dialysis_sessions', function (Blueprint $table) {
            $table->string('chair_number')->nullable()->change();
        });

        DB::table('dialysis_sessions')
            ->where('status', 'BELUM_HADIR')
            ->update(['chair_number' => null]);

        DB::table('dialysis_sessions')
            ->whereNotNull('chair_number')
            ->where('status', '!=', 'BELUM_HADIR')
            ->update([
                'arrived_at' => DB::raw('COALESCE(arrived_at, created_at)'),
                'called_at' => DB::raw('COALESCE(called_at, created_at)'),
            ]);

        $dates = DB::table('dialysis_sessions')
            ->whereNotNull('chair_number')
            ->whereNull('queue_number')
            ->distinct()
            ->pluck('scheduled_date');

        foreach ($dates as $date) {
            $ids = DB::table('dialysis_sessions')
                ->whereDate('scheduled_date', $date)
                ->whereNotNull('chair_number')
                ->whereNull('queue_number')
                ->orderBy('id')
                ->pluck('id');

            $number = (int) DB::table('dialysis_sessions')->whereDate('scheduled_date', $date)->max('queue_number');

            foreach ($ids as $id) {
                $number++;
                DB::table('dialysis_sessions')->where('id', $id)->update(['queue_number' => $number]);
            }
        }
    }

    public function down(): void
    {
        DB::table('dialysis_sessions')->whereNull('chair_number')->update(['chair_number' => 'A-00']);

        Schema::table('dialysis_sessions', function (Blueprint $table) {
            $table->string('chair_number')->nullable(false)->change();
            $table->dropColumn(['queue_number', 'arrived_at', 'called_at']);
        });
    }
};
