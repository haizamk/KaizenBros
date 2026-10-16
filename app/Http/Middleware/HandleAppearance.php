<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Symfony\Component\HttpFoundation\Response;

class HandleAppearance
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $appearance = $request->cookie('appearance', 'dark');

        if (! in_array($appearance, ['light', 'dark', 'system'], true)) {
            $appearance = 'dark';
        }

        View::share('appearance', $appearance);

        $textSize = $request->cookie('text_size', 'md');

        if (! in_array($textSize, ['sm', 'md', 'lg', 'xl'], true)) {
            $textSize = 'md';
        }

        View::share('textSize', $textSize);

        return $next($request);
    }
}
