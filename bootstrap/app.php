<?php

use App\Http\Middleware\EnsureUserRole;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Illuminate\Session\TokenMismatchException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: '*');

        $middleware->encryptCookies(except: ['appearance', 'sidebar_state', 'text_size']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'role' => EnsureUserRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->render(function (TokenMismatchException $e, Request $request) {
            if ($request->header('X-Inertia')) {
                return redirect()
                    ->route('login')
                    ->with('status', 'Sesi tamat tempoh. Sila log masuk semula.');
            }

            if ($request->is('login') || $request->is('login/*')) {
                return redirect()
                    ->route('login')
                    ->with('status', 'Sesi tamat tempoh. Muat semula halaman dan cuba log masuk semula.');
            }

            return redirect()
                ->back()
                ->withInput($request->except('password', '_token'))
                ->withErrors(['email' => 'Sesi tamat tempoh. Muat semula halaman dan cuba semula.']);
        });
    })->create();
