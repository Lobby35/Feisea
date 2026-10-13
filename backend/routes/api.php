<?php

use App\Http\Controllers\UserController;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    try {
        DB::select('SELECT 1');
        return response()->json(['status' => 'ok']);
    } catch (QueryException) {
        return response()->json(['status' => 'database unavailable'], 503);
    }
});

Route::pattern('user', '[1-9][0-9]{0,18}');
Route::apiResource('users', UserController::class);
