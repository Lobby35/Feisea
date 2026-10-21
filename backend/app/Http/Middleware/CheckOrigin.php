<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckOrigin
{
    public function handle(Request $request, Closure $next)
    {
        $request->setUserResolver(function () {
            return null;
        });

        if (!in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'])) {
            if ($request->header('X-Requested-With') !== 'XMLHttpRequest') {
                abort(403, 'Request header required.');
            }

            $origin = $request->header('Origin');
            $allowedOrigins = config('feisea.origins');
            if ($origin !== null && !in_array($origin, $allowedOrigins, true)) {
                abort(403, 'Origin is not allowed.');
            }
        }

        return $next($request);
    }
}
