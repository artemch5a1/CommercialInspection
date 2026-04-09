<?php

use Illuminate\Support\Facades\Route;

// Тестовый маршрут
Route::get('/test', function () {
    return response()->json(['message' => 'API работает']);
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

// Типы вагонов
Route::get('/types-wagons', [\App\Http\Controllers\TypesWagonController::class, 'index']);
Route::post('/types-wagons', [\App\Http\Controllers\TypesWagonController::class, 'store']);
Route::get('/types-wagons/{id}', [\App\Http\Controllers\TypesWagonController::class, 'show']);
Route::put('/types-wagons/{id}', [\App\Http\Controllers\TypesWagonController::class, 'update']);
Route::delete('/types-wagons/{id}', [\App\Http\Controllers\TypesWagonController::class, 'destroy']);
Route::get('/types-wagons/{id}/malfunctions', [\App\Http\Controllers\TypesWagonController::class, 'getMalfunctions']);

// Неисправности
Route::get('/malfunctions', [\App\Http\Controllers\MalfunctionController::class, 'index']);
Route::post('/malfunctions', [\App\Http\Controllers\MalfunctionController::class, 'store']);
Route::get('/malfunctions/{id}', [\App\Http\Controllers\MalfunctionController::class, 'show']);
Route::put('/malfunctions/{id}', [\App\Http\Controllers\MalfunctionController::class, 'update']);
Route::delete('/malfunctions/{id}', [\App\Http\Controllers\MalfunctionController::class, 'destroy']);
Route::get('/malfunctions/by-wagon/{wagonTypeId}', [\App\Http\Controllers\MalfunctionController::class, 'getByWagonType']);

// Задания
Route::get('/tasks', [\App\Http\Controllers\TaskController::class, 'index']);
Route::post('/tasks', [\App\Http\Controllers\TaskController::class, 'store']);
Route::get('/tasks/{id}', [\App\Http\Controllers\TaskController::class, 'show']);
Route::put('/tasks/{id}', [\App\Http\Controllers\TaskController::class, 'update']);
Route::delete('/tasks/{id}', [\App\Http\Controllers\TaskController::class, 'destroy']);
Route::get('/tasks/by-topic/{topicId}', [\App\Http\Controllers\TaskController::class, 'getByTopic']);

// Связи заданий и неисправностей
Route::get('/task-malfunctions', [\App\Http\Controllers\TaskMalfunctionController::class, 'index']);
Route::post('/task-malfunctions', [\App\Http\Controllers\TaskMalfunctionController::class, 'store']);
Route::get('/task-malfunctions/{id}', [\App\Http\Controllers\TaskMalfunctionController::class, 'show']);
Route::delete('/task-malfunctions/{id}', [\App\Http\Controllers\TaskMalfunctionController::class, 'destroy']);
Route::get('/tasks/{taskId}/malfunctions', [\App\Http\Controllers\TaskMalfunctionController::class, 'getByTask']);

// Пользователи
Route::get('/users', [\App\Http\Controllers\UserController::class, 'index']);
Route::get('/users/{id}', [\App\Http\Controllers\UserController::class, 'show']);
Route::put('/users/{id}', [\App\Http\Controllers\UserController::class, 'update']);
Route::delete('/users/{id}', [\App\Http\Controllers\UserController::class, 'destroy']);
Route::get('/users/{id}/statistics', [\App\Http\Controllers\UserController::class, 'getStatistics']);

// СТАТИСТИКА - ТОЛЬКО ОДИН РАЗ!
Route::post('/statistics', [\App\Http\Controllers\StatisticController::class, 'store']);
Route::get('/statistics/user/{userId}', [\App\Http\Controllers\StatisticController::class, 'getUserStatistics']);
Route::get('/statistics/{statistic}', [\App\Http\Controllers\StatisticController::class, 'show']);

// Найденные неисправности - ИСПРАВЬТЕ (было Models, должно быть Http\Controllers)
Route::get('/find-faults', [\App\Http\Controllers\FindFaultController::class, 'index']);
Route::post('/find-faults', [\App\Http\Controllers\FindFaultController::class, 'store']);
Route::get('/find-faults/statistic/{statisticId}', [\App\Http\Controllers\FindFaultController::class, 'getByStatistic']);
Route::get('/find-faults/{findFault}', [\App\Http\Controllers\FindFaultController::class, 'show']);
