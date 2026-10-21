<?php

use App\Http\Middleware\AuthenticateSession;
use App\Http\Middleware\CheckOrigin;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(api: __DIR__.'/../routes/api.php', commands: __DIR__.'/../routes/console.php')
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->trustProxies(at: explode(',', env('TRUSTED_PROXIES', '')));
        $middleware->prependToGroup('api', CheckOrigin::class);
        $middleware->alias(['session.auth' => AuthenticateSession::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(function (Request $request) {
            return true;
        });
        $exceptions->render(function (QueryException $exception) {
            $code = $exception->errorInfo[0] ?? null;
            if ($code === '23505') {
                return response()->json(['message' => 'That value is already in use.'], 409);
            }
            if ($code === '23503') {
                return response()->json(['message' => 'Related records prevent this change.'], 409);
            }
            if ($code === '22003') {
                return response()->json(['message' => 'User not found.'], 404);
            }

            return null;
        });
    })
    ->create();
