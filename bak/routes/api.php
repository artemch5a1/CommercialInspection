<?php

use Illuminate\Support\Facades\Route;

Route::get('/test', function () {
    return response()->json([
        'message' => 'API работает'
    ]);
});
Route::post('/statistics', [\App\Http\Controllers\StatisticController::class, 'store']);
Route::get('/users/{id}/level', [\App\Http\Controllers\UserController::class, 'getUserLevel']);
Route::post('/users/{id}/update-level', [\App\Http\Controllers\UserController::class, 'updateUserLevel']);
