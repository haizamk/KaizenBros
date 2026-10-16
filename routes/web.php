<?php

use App\Enums\ShiftSlot;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\ClinicDocumentController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MedicalRecordController;
use App\Http\Controllers\MedicalReportController;
use App\Http\Controllers\NurseSessionController;
use App\Http\Controllers\PatientPortalController;
use App\Http\Controllers\PromotionController;
use App\Http\Controllers\RegistrationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'centre' => config('kaizenbros.centre'),
        'shifts' => collect(ShiftSlot::cases())->map(fn (ShiftSlot $shift): array => [
            'label' => $shift->label(),
            'time_range' => $shift->timeRange(),
        ])->values(),
    ]);
})->name('home');

Route::get('/daftar', [RegistrationController::class, 'create'])->name('registrations.create');
Route::post('/daftar', [RegistrationController::class, 'store'])->name('registrations.store');
Route::get('/daftar/selesai/{reference}', [RegistrationController::class, 'received'])->name('registrations.received');

Route::get('/promosi/pesakit-baru', [PromotionController::class, 'patients'])->name('promotions.patients');
Route::get('/promosi/pengangkutan', [PromotionController::class, 'transport'])->name('promotions.transport');
Route::get('/promosi/jururawat', [PromotionController::class, 'nurses'])->name('promotions.nurses');
Route::post('/promosi/jururawat', [PromotionController::class, 'storeNurse'])->name('promotions.nurses.store');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::middleware('role:nurse,admin')->group(function () {
        Route::get('/jururawat', [NurseSessionController::class, 'index'])->name('nurse.home');
        Route::get('/jururawat/ringkasan', [NurseSessionController::class, 'summary'])->name('nurse.summary');
        Route::get('/jururawat/jadual', [NurseSessionController::class, 'schedule'])->name('nurse.schedule');
        Route::get('/jururawat/pesakit', [NurseSessionController::class, 'patients'])->name('nurse.patients');
        Route::get('/jururawat/sesi', [NurseSessionController::class, 'sessions'])->name('nurse.sessions');
        Route::get('/jururawat/tetapan', [NurseSessionController::class, 'settings'])->name('nurse.settings');
        Route::post('/jururawat/tetapan', [NurseSessionController::class, 'updateIdentity'])->name('nurse.identity.update');
        Route::get('/jururawat/darah', [MedicalRecordController::class, 'index'])->name('nurse.records.index');
        Route::post('/jururawat/darah', [MedicalRecordController::class, 'store'])->name('nurse.records.store');
        Route::get('/jururawat/laporan/{report}', [MedicalReportController::class, 'download'])->name('nurse.reports.download');
        Route::post('/jururawat/sesi/{session}/tiba', [NurseSessionController::class, 'arrive'])->name('nurse.sessions.arrive');
        Route::post('/jururawat/sesi/{session}/panggil', [NurseSessionController::class, 'call'])->name('nurse.sessions.call');
        Route::post('/jururawat/kerusi/rosak', [NurseSessionController::class, 'blockChair'])->name('nurse.chairs.block');
        Route::post('/jururawat/kerusi/pulih', [NurseSessionController::class, 'restoreChair'])->name('nurse.chairs.restore');
        Route::post('/jururawat/sesi/{session}/daftar-masuk', [NurseSessionController::class, 'checkIn'])->name('nurse.sessions.check-in');
        Route::post('/jururawat/sesi/{session}/mula', [NurseSessionController::class, 'start'])->name('nurse.sessions.start');
        Route::post('/jururawat/sesi/{session}/selesai', [NurseSessionController::class, 'complete'])->name('nurse.sessions.complete');
        Route::post('/jururawat/sesi/{session}/tekanan-semasa', [NurseSessionController::class, 'recordDuring'])->name('nurse.sessions.intra');
    });

    Route::middleware('role:patient')->group(function () {
        Route::get('/pesakit', [PatientPortalController::class, 'index'])->name('patient.home');
        Route::get('/pesakit/sesi', [PatientPortalController::class, 'session'])->name('patient.session');
        Route::get('/pesakit/jadual', [PatientPortalController::class, 'schedule'])->name('patient.schedule');
        Route::get('/pesakit/ubat', [PatientPortalController::class, 'medications'])->name('patient.medications');
        Route::get('/pesakit/darah', [PatientPortalController::class, 'blood'])->name('patient.blood');
        Route::get('/pesakit/timbang', [PatientPortalController::class, 'weights'])->name('patient.weights');
        Route::get('/pesakit/rekod', [PatientPortalController::class, 'history'])->name('patient.history');
        Route::get('/pesakit/dokumen/{document}', [ClinicDocumentController::class, 'downloadOwn'])->name('patient.documents.download');
        Route::get('/pesakit/laporan/{report}', [MedicalReportController::class, 'downloadOwn'])->name('patient.reports.download');
    });

    Route::middleware('role:admin')->group(function () {
        Route::get('/admin', [AdminController::class, 'index'])->name('admin.home');
        Route::post('/admin/permohonan/{registration}/lulus', [AdminController::class, 'approveRegistration'])->name('admin.registrations.approve');
        Route::post('/admin/permohonan/{registration}/tolak', [AdminController::class, 'rejectRegistration'])->name('admin.registrations.reject');
        Route::post('/admin/permohonan/{registration}/dokumen', [ClinicDocumentController::class, 'storeForRegistration'])->name('admin.documents.store');
        Route::post('/admin/pesakit/{patient}/dokumen', [ClinicDocumentController::class, 'storeForPatient'])->name('admin.patients.documents.store');
        Route::post('/admin/pesakit/{patient}/syif', [AdminController::class, 'updateShift'])->name('admin.patients.shift');
        Route::post('/admin/darah/{record}/analisa', [MedicalRecordController::class, 'storeDoctorNote'])->name('admin.records.doctor');
        Route::get('/admin/dokumen/{document}', [ClinicDocumentController::class, 'download'])->name('admin.documents.download');
    });
});

require __DIR__.'/settings.php';
