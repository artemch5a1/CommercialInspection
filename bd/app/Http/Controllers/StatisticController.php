<?php

namespace App\Http\Controllers;

use App\Models\Statistic;
use App\Models\Find_fault;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class StatisticController extends Controller
{
    public function store(Request $request)
    {
        DB::beginTransaction();

        try {
            Log::info('Statistic store request:', $request->all());

            $data = $request->all();

            // Проверяем полученные данные
            if (!isset($data['task_id'])) {
                return response()->json(['success' => false, 'message' => 'Нет task_id'], 400);
            }

            if (!isset($data['defects']) || !is_array($data['defects'])) {
                return response()->json(['success' => false, 'message' => 'Нет defects или неверный формат'], 400);
            }

            // Проверяем пользователя
            $user = Auth::user();
            if (!$user && isset($data['user_id'])) {
                $user = User::find($data['user_id']);
            }

            if (!$user) {
                Log::error('User not found');
                return response()->json([
                    'success' => false,
                    'message' => 'Пользователь не найден'
                ], 404);
            }

            // Проверяем задание
            $task = Task::find($data['task_id']);
            if (!$task) {
                return response()->json([
                    'success' => false,
                    'message' => 'Задание не найдено'
                ], 404);
            }

            // Создаем статистику
            $foundCount = 0;
            $totalCount = count($data['defects']);

            foreach ($data['defects'] as $defect) {
                if (isset($defect['status']) && $defect['status'] === 'found') {
                    $foundCount++;
                }
            }

            $grade = $totalCount > 0 ? round(($foundCount / $totalCount) * 5, 1) : 0;

            $statistic = Statistic::create([
                'task_id' => $data['task_id'],
                'date_discovery' => now()->toDateString(),
                'grade' => $grade,
                'user_id' => $user->id
            ]);

            Log::info('Statistic created with ID: ' . $statistic->id);

            // ===== ВАЖНО: СОЗДАЕМ ЗАПИСИ В find_faults =====
            foreach ($data['defects'] as $defect) {
                // Проверяем наличие task_malfunction_id
                if (!isset($defect['task_malfunction_id'])) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => 'Нет task_malfunction_id в defect'
                    ], 400);
                }

                $right = (isset($defect['status']) && $defect['status'] === 'found') ? '1' : '0';
                $comment = ($right === '1') ? 'Неисправность обнаружена' : 'Неисправность не обнаружена';

                // Создаем запись в find_faults
                $findFault = Find_fault::create([
                    'user_id' => $user->id,
                    'task__malfunction_id' => $defect['task_malfunction_id'], // Обратите внимание на ДВОЙНОЕ подчеркивание!
                    'statistic_id' => $statistic->id,
                    'right' => $right,
                    'comment' => $comment
                ]);

                Log::info('Find_fault created:', [
                    'id' => $findFault->id,
                    'task__malfunction_id' => $defect['task_malfunction_id'],
                    'right' => $right
                ]);
            }

            DB::commit();

            // ОБНОВЛЯЕМ УРОВЕНЬ ПОЛЬЗОВАТЕЛЯ
            $userController = new UserController();
            $userController->updateUserLevel($user->id);

            return response()->json([
                'success' => true,
                'message' => 'Результаты успешно сохранены',
                'statistic_id' => $statistic->id,
                'grade' => $grade,
                'found_count' => $foundCount,
                'total_count' => $totalCount
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error in store: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Ошибка сервера: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getUserStatistics($userId)
    {
        try {
            $statistics = Statistic::where('user_id', $userId)
                ->with(['task.topic', 'findFaults'])
                ->orderBy('created_at', 'desc')
                ->get();

            $formattedStatistics = $statistics->map(function($stat) {
                $task = $stat->task;
                $findFaults = $stat->findFaults;

                $defects = [];
                $foundCount = 0;
                $totalCount = $findFaults->count();

                foreach ($findFaults as $fault) {
                    $status = $fault->right == '1' ? 'found' : 'not_found';
                    if ($status === 'found') $foundCount++;

                    $defects[] = [
                        'name' => 'Неисправность',
                        'status' => $status,
                        'comment' => $fault->comment
                    ];
                }

                return [
                    'id' => $stat->id,
                    'date' => $stat->date_discovery ?? now()->format('Y-m-d'),
                    'theme' => $task && $task->topic ? $task->topic->name : 'Без темы',
                    'title' => $task ? $task->name : 'Задание удалено',
                    'mode' => $task ? ($task->training_mode ?? 'Не указан') : 'Не указан',
                    'grade' => $stat->grade ?? 0,
                    'wagonType' => 'Не указан',
                    'defects' => $defects,
                    'comment' => $foundCount < $totalCount ? 'Не все неисправности найдены' : 'Все неисправности найдены'
                ];
            });

            return response()->json([
                'success' => true,
                'statistics' => $formattedStatistics
            ]);

        } catch (\Exception $e) {
            Log::error('Error loading statistics: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Ошибка загрузки статистики'
            ], 500);
        }
    }

    public function show($statisticId)
    {
        try {
            $statistic = Statistic::with(['task', 'findFaults'])
                ->findOrFail($statisticId);

            return response()->json([
                'success' => true,
                'statistic' => $statistic
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Статистика не найдена'
            ], 404);
        }
    }
}
