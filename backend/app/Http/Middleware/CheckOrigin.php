<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckOrigin
{
    public function handle(Request $request, Closure $next)
    {
        $request->setUserResolver(fn () => null);
        if (!in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'])) {
            abort_unless($request->header('X-Requested-With') === 'XMLHttpRequest', 403, 'Request header required.');
            $origin = $request->header('Origin');
            abort_if($origin !== null && !in_array($origin, config('feisea.origins'), true), 403, 'Origin is not allowed.');
        }

        return $next($request);
    }
}
