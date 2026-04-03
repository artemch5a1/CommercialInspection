<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});
// Публичные маршруты
Route::post('/register', [\App\Http\Controllers\UserController::class, 'register']);
Route::post('/login', [\App\Http\Controllers\UserController::class, 'login']);

// Группы
Route::get('/groups', [\App\Http\Controllers\GroupController::class, 'getGroups']);
Route::post('/groups', [\App\Http\Controllers\GroupController::class, 'createGroup']);
Route::put('/groups/{id}', [\App\Http\Controllers\GroupController::class, 'updateGroup']);
Route::delete('/groups/{id}', [\App\Http\Controllers\GroupController::class, 'deleteGroup']);

// Профессии
Route::get('/professions', [\App\Http\Controllers\ProfessionController::class, 'getProfessions']);
Route::post('/professions', [\App\Http\Controllers\ProfessionController::class, 'createProfession']);
Route::put('/professions/{id}', [\App\Http\Controllers\ProfessionController::class, 'updateProfession']);
Route::delete('/professions/{id}', [\App\Http\Controllers\ProfessionController::class, 'deleteProfession']);

// Темы
Route::get('/topics', [\App\Http\Controllers\TopicController::class, 'getTopics']);
Route::post('/topics', [\App\Http\Controllers\TopicController::class, 'createTopic']);
Route::put('/topics/{id}', [\App\Http\Controllers\TopicController::class, 'updateTopic']);
Route::delete('/topics/{id}', [\App\Http\Controllers\TopicController::class, 'deleteTopic']);

// Пользователи
Route::get('/users', [\App\Http\Controllers\UserController::class, 'index']);
Route::get('/users/{id}', [\App\Http\Controllers\UserController::class, 'show']);
Route::put('/users/{id}', [\App\Http\Controllers\UserController::class, 'update']);
Route::delete('/users/{id}', [\App\Http\Controllers\UserController::class, 'destroy']);
Route::get('/users/{id}/statistics', [\App\Http\Controllers\UserController::class, 'getStatistics']);
