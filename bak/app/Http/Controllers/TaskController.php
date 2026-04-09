<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Task_Malfunction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TaskController extends Controller
{
    // Метод для определения уровня задания по количеству неисправностей
    private function determineLevel($malfunctionsCount)
    {
        if ($malfunctionsCount <= 2) {
            return 'simple'; // просто
        } elseif ($malfunctionsCount <= 5) {
            return 'medium'; // средний
        } elseif ($malfunctionsCount <= 10) {
            return 'hard'; // сложный
        } else {
            return 'maximum'; // максимально сложный
        }
    }

    public function index()
    {
        try {
            $tasks = Task::with(['topic', 'user', 'group', 'taskMalfunctions.malfunction'])->get();
            return response()->json([
                'success' => true,
                'tasks' => $tasks // $tasks уже содержит все поля, включая level
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting tasks: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to get tasks'
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            Log::info('Creating task with data:', $request->all());

            $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'required|string',
                'training_mode' => 'required|string',
                'weather_conditions' => 'nullable|string',
                'times_day' => 'nullable|string',
                'topic_id' => 'required|exists:topics,id',
                'access' => 'required|string|in:all,group,user',
                'user_id' => 'nullable|exists:users,id',
                'group_id' => 'nullable|exists:groups,id',
                'selected_defects' => 'nullable|array'
            ]);

            // Получаем количество выбранных неисправностей
            $selectedDefects = $request->selected_defects ?? [];
            $malfunctionsCount = count($selectedDefects);

            // Определяем уровень задания
            $level = $this->determineLevel($malfunctionsCount);

            Log::info('Task level determined: ' . $level . ' (based on ' . $malfunctionsCount . ' malfunctions)');

            // Формируем данные для создания
            $taskData = [
                'name' => $request->name,
                'description' => $request->description,
                'training_mode' => $request->training_mode,
                'weather_conditions' => $request->weather_conditions,
                'times_day' => $request->times_day,
                'topic_id' => $request->topic_id,
                'access' => $request->access,
                'level' => $level, // ВАЖНО: добавляем уровень!
                'user_id' => null,
                'group_id' => null
            ];

            // В зависимости от типа доступа заполняем соответствующие поля
            switch ($request->access) {
                case 'user':
                    $taskData['user_id'] = $request->user_id;
                    break;
                case 'group':
                    $taskData['group_id'] = $request->group_id;
                    break;
                case 'all':
                default:
                    // Оба поля остаются null
                    break;
            }

            // Создаем задание
            $task = Task::create($taskData);

            Log::info('Task created with ID: ' . $task->id . ', level: ' . $level);

            // Добавляем выбранные неисправности
            if ($malfunctionsCount > 0) {
                foreach ($selectedDefects as $malfunctionId) {
                    Task_Malfunction::create([
                        'task_id' => $task->id,
                        'malfunction_id' => $malfunctionId
                    ]);
                }
                Log::info('Added ' . $malfunctionsCount . ' malfunctions to task_malfunctions');
            }

            return response()->json([
                'success' => true,
                'task' => $task->load(['topic', 'user', 'group']),
                'message' => 'Task created successfully',
                'level_info' => [
                    'level' => $level,
                    'malfunctions_count' => $malfunctionsCount
                ]
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation error:', $e->errors());
            return response()->json([
                'success' => false,
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error creating task: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to create task: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $task = Task::findOrFail($id);

            $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'required|string',
                'training_mode' => 'required|string',
                'weather_conditions' => 'nullable|string',
                'times_day' => 'nullable|string',
                'topic_id' => 'required|exists:topics,id',
                'access' => 'required|string|in:all,group,user',
                'user_id' => 'nullable|exists:users,id',
                'group_id' => 'nullable|exists:groups,id',
                'selected_defects' => 'nullable|array'
            ]);

            // Получаем количество выбранных неисправностей
            $selectedDefects = $request->selected_defects ?? [];
            $malfunctionsCount = count($selectedDefects);

            // Определяем уровень задания
            $level = $this->determineLevel($malfunctionsCount);

            Log::info('Updating task level: ' . $level . ' (based on ' . $malfunctionsCount . ' malfunctions)');

            // Обновляем основные данные
            $taskData = [
                'name' => $request->name,
                'description' => $request->description,
                'training_mode' => $request->training_mode,
                'weather_conditions' => $request->weather_conditions,
                'times_day' => $request->times_day,
                'topic_id' => $request->topic_id,
                'access' => $request->access,
                'level' => $level, // ВАЖНО: обновляем уровень!
                'user_id' => null,
                'group_id' => null
            ];

            // В зависимости от типа доступа заполняем соответствующие поля
            switch ($request->access) {
                case 'user':
                    $taskData['user_id'] = $request->user_id;
                    break;
                case 'group':
                    $taskData['group_id'] = $request->group_id;
                    break;
                case 'all':
                default:
                    // Оба поля остаются null
                    break;
            }

            $task->update($taskData);

            // Обновляем неисправности
            if ($request->has('selected_defects')) {
                // Удаляем старые связи
                Task_Malfunction::where('task_id', $task->id)->delete();

                // Добавляем новые
                foreach ($selectedDefects as $malfunctionId) {
                    Task_Malfunction::create([
                        'task_id' => $task->id,
                        'malfunction_id' => $malfunctionId
                    ]);
                }
                Log::info('Updated malfunctions for task ' . $task->id . ': ' . $malfunctionsCount . ' malfunctions');
            }

            return response()->json([
                'success' => true,
                'task' => $task->load(['topic', 'user', 'group']),
                'message' => 'Task updated successfully',
                'level_info' => [
                    'level' => $level,
                    'malfunctions_count' => $malfunctionsCount
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating task: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to update task: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $task = Task::findOrFail($id);
            // Сначала удаляем связи с неисправностями
            Task_Malfunction::where('task_id', $task->id)->delete();
            // Потом удаляем само задание
            $task->delete();

            return response()->json([
                'success' => true,
                'message' => 'Task deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting task: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to delete task'
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $task = Task::with(['topic', 'user', 'group', 'taskMalfunctions.malfunction.typesWagon'])->findOrFail($id);
            return response()->json([
                'success' => true,
                'task' => $task
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Task not found'
            ], 404);
        }
    }

    public function getByTopic($topicId)
    {
        try {
            $tasks = Task::where('topic_id', $topicId)
                ->with(['topic', 'user', 'group', 'taskMalfunctions.malfunction'])
                ->get();

            return response()->json([
                'success' => true,
                'tasks' => $tasks
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting tasks by topic: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to get tasks'
            ], 500);
        }
    }
}
