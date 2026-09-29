<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DialysisSessionController;
use App\Http\Controllers\NursePortalController;
use App\Http\Controllers\PatientPortalController;
use App\Http\Controllers\AdminPortalController;
use App\Http\Controllers\ReportController;

/*
|--------------------------------------------------------------------------
| Web Routes (Inertia.js + Laravel 13)
|--------------------------------------------------------------------------
*/

// Public Website Routes
Route::get('/', function () {
    return Inertia::render('Public/Home');
})->name('public.home');

Route::get('/about', function () {
    return Inertia::render('Public/About');
})->name('public.about');

Route::get('/services', function () {
    return Inertia::render('Public/Services');
})->name('public.services');

Route::get('/centre-info', function () {
    return Inertia::render('Public/CentreInfo');
})->name('public.centre');

Route::get('/contact', function () {
    return Inertia::render('Public/Contact');
})->name('public.contact');

// Authentication Routes
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'authenticate'])->name('login.post');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// Patient Portal Routes (Requires PATIENT role)
Route::middleware(['auth', 'role:PATIENT'])->prefix('pesakit')->name('patient.')->group(function () {
    Route::get('/utama', [PatientPortalController::class, 'dashboard'])->name('dashboard');
    Route::get('/jadual', [PatientPortalController::class, 'schedule'])->name('schedule');
    Route::get('/rekod', [PatientPortalController::class, 'records'])->name('records');
    Route::get('/ubat', [PatientPortalController::class, 'medications'])->name('medications');
    Route::get('/profil', [PatientPortalController::class, 'profile'])->name('profile');
});

// Nurse Portal Routes (Requires HEAD_NURSE or STAFF_NURSE role)
Route::middleware(['auth', 'role:HEAD_NURSE,STAFF_NURSE'])->prefix('jururawat')->name('nurse.')->group(function () {
    Route::get('/hari-ini', [NursePortalController::class, 'todayDashboard'])->name('today');
    Route::get('/pesakit', [NursePortalController::class, 'patientList'])->name('patients');
    Route::get('/pesakit/{id}', [NursePortalController::class, 'patientDetail'])->name('patient.detail');
    Route::get('/sesi-dialisis', [NursePortalController::class, 'sessionsMonitor'])->name('sessions');
    Route::get('/rekod', [NursePortalController::class, 'records'])->name('records');
    Route::get('/laporan', [ReportController::class, 'index'])->name('reports');
    Route::get('/laporan/export', [ReportController::class, 'exportCsv'])->name('reports.export');
    Route::get('/tetapan', [NursePortalController::class, 'settings'])->name('settings');

    // Clinical Execution Actions
    Route::post('/sesi/{id}/check-in', [DialysisSessionController::class, 'checkIn'])->name('session.checkin');
    Route::post('/sesi/{id}/vital', [DialysisSessionController::class, 'recordHourlyVital'])->name('session.vital');
    Route::post('/sesi/{id}/catatan', [DialysisSessionController::class, 'addNote'])->name('session.note');
    Route::post('/sesi/{id}/tamatkan', [DialysisSessionController::class, 'finishSession'])->name('session.finish');
});

// Admin Portal Routes (Requires ADMIN or NEPHROLOGIST role)
Route::middleware(['auth', 'role:ADMIN,NEPHROLOGIST'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [AdminPortalController::class, 'dashboard'])->name('dashboard');
    Route::get('/users', [AdminPortalController::class, 'users'])->name('users');
    Route::post('/users', [AdminPortalController::class, 'storeUser'])->name('users.store');
    Route::get('/patients', [AdminPortalController::class, 'patients'])->name('patients');
    Route::get('/nurses', [AdminPortalController::class, 'nurses'])->name('nurses');
    Route::get('/chairs-machines', [AdminPortalController::class, 'stations'])->name('stations');
    Route::get('/audit-logs', [AdminPortalController::class, 'auditLogs'])->name('audit.logs');
    Route::get('/settings', [AdminPortalController::class, 'settings'])->name('settings');
});
