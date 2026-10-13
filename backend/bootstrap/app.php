<?php

use Illuminate\Database\QueryException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(api: __DIR__.'/../routes/api.php')
    ->withMiddleware()
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(fn (Request $request) => true);
        $exceptions->render(function (QueryException $exception) {
            return match ($exception->errorInfo[0] ?? null) {
                '23505' => response()->json(['message' => 'Email is already in use.'], 409),
                '23503' => response()->json(['message' => 'Related records prevent this change.'], 409),
                '22003' => response()->json(['message' => 'User not found.'], 404),
                default => null,
            };
        });
    })
    ->create();
