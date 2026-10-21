<?php

use App\Http\Controllers\UserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProfileSetupController;
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
Route::pattern('role', 'candidate|company');
Route::post('/{role}/register', [AuthController::class, 'register'])->middleware('throttle:5,1,register');
Route::post('/{role}/login', [AuthController::class, 'login'])->middleware('throttle:8,1,login');
Route::post('/{role}/verification/resend', [AuthController::class, 'resend'])->middleware('throttle:3,1,resend');
Route::post('/verification/verify', [AuthController::class, 'verify'])->middleware('throttle:10,1,verify');
Route::get('/me', [ProfileController::class, 'show'])->middleware('session.auth');
Route::post('/logout', [AuthController::class, 'logout'])->middleware('session.auth');

Route::prefix('candidate')->middleware('session.auth:candidate')->group(function () {
    Route::get('/me', [ProfileController::class, 'show']);
    Route::post('/setup/complete', [ProfileSetupController::class, 'complete']);
    Route::patch('/profile', [ProfileController::class, 'update']);
    Route::get('/photo', [ProfileController::class, 'photo']);
    Route::post('/photo', [ProfileController::class, 'uploadPhoto']);
    Route::delete('/photo', [ProfileController::class, 'deletePhoto']);
    Route::get('/cv', [ProfileController::class, 'cv']);
    Route::post('/cv', [ProfileController::class, 'uploadCv']);
    Route::delete('/cv', [ProfileController::class, 'deleteCv']);
    Route::post('/cv/extract', [ProfileController::class, 'extractCv'])->middleware('throttle:5,1,extract');
});

Route::prefix('company')->middleware('session.auth:company')->group(function () {
    Route::get('/me', [ProfileController::class, 'show']);
    Route::post('/setup/complete', [ProfileSetupController::class, 'complete']);
    Route::patch('/profile', [ProfileController::class, 'update']);
    Route::get('/photo', [ProfileController::class, 'photo']);
    Route::post('/photo', [ProfileController::class, 'uploadPhoto']);
    Route::delete('/photo', [ProfileController::class, 'deletePhoto']);
});

Route::apiResource('users', UserController::class)->middleware('session.auth:admin');
