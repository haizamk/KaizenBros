<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NurseSessionController;
use App\Http\Controllers\PatientPortalController;
use App\Http\Controllers\RegistrationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'centre' => config('kaizenbros.centre'),
    ]);
})->name('home');

Route::get('/daftar', [RegistrationController::class, 'create'])->name('registrations.create');
Route::post('/daftar', [RegistrationController::class, 'store'])->name('registrations.store');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::middleware('role:nurse,admin')->group(function () {
        Route::get('/jururawat', [NurseSessionController::class, 'index'])->name('nurse.home');
        Route::post('/jururawat/sesi/{session}/daftar-masuk', [NurseSessionController::class, 'checkIn'])->name('nurse.sessions.check-in');
        Route::post('/jururawat/sesi/{session}/mula', [NurseSessionController::class, 'start'])->name('nurse.sessions.start');
        Route::post('/jururawat/sesi/{session}/selesai', [NurseSessionController::class, 'complete'])->name('nurse.sessions.complete');
    });

    Route::middleware('role:patient')->group(function () {
        Route::get('/pesakit', [PatientPortalController::class, 'index'])->name('patient.home');
    });

    Route::middleware('role:admin')->group(function () {
        Route::get('/admin', [AdminController::class, 'index'])->name('admin.home');
    });
});

require __DIR__.'/settings.php';
