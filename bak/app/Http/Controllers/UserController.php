<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Group;
use App\Models\Profession;
use App\Models\Types_wagon;
use App\Models\Malfunction;
use App\Models\Find_fault;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class UserController extends Controller
{
    // Конструктор для автоматического создания данных при запуске
    public function __construct()
    {
        $this->ensureAdminExists();
        $this->ensureTypesWagonsAndMalfunctions();
    }

    // Метод для определения уровня пользователя по количеству найденных неисправностей
    private function determineUserLevel($foundFaultsCount)
    {
        if ($foundFaultsCount <= 2) {
            return 'beginner'; // начальный
        } elseif ($foundFaultsCount <= 5) {
            return 'medium'; // средний
        } elseif ($foundFaultsCount <= 10) {
            return 'hard'; // сложный
        } else {
            return 'expert'; // высокий (эксперт)
        }
    }

    // Метод для обновления уровня пользователя на основе найденных неисправностей
    public function updateUserLevel($userId)
    {
        try {
            $user = User::findOrFail($userId);

            // Если пользователь учитель или админ, уровень не обновляем
            if ($user->role == true) {
                Log::info('User is teacher/admin, level not updated', ['user_id' => $userId]);
                return;
            }

            // Подсчитываем количество найденных неисправностей (где right = 1)
            $foundFaultsCount = Find_fault::where('user_id', $userId)
                ->where('right', '1')
                ->count();

            // Определяем новый уровень
            $newLevel = $this->determineUserLevel($foundFaultsCount);
            $oldLevel = $user->level;

            // Обновляем уровень если он изменился
            if ($oldLevel !== $newLevel) {
                $user->level = $newLevel;
                $user->save();

                Log::info('User level updated', [
                    'user_id' => $userId,
                    'old_level' => $oldLevel,
                    'new_level' => $newLevel,
                    'found_faults_count' => $foundFaultsCount
                ]);
            }

            return $newLevel;

        } catch (\Exception $e) {
            Log::error('Error updating user level: ' . $e->getMessage());
            return null;
        }
    }

    // Метод для получения уровня пользователя с деталями
    public function getUserLevel($userId)
    {
        try {
            $user = User::findOrFail($userId);

            if ($user->role == true) {
                return response()->json([
                    'success' => true,
                    'level' => null,
                    'level_text' => 'Преподаватель/Администратор',
                    'found_faults_count' => null,
                    'next_level_needed' => null
                ]);
            }

            $foundFaultsCount = Find_fault::where('user_id', $userId)
                ->where('right', '1')
                ->count();

            $currentLevel = $user->level ?? 'beginner';

            // Определяем сколько нужно для следующего уровня
            $nextLevelNeeded = null;
            if ($foundFaultsCount <= 2) {
                $nextLevelNeeded = 3 - $foundFaultsCount;
            } elseif ($foundFaultsCount <= 5) {
                $nextLevelNeeded = 6 - $foundFaultsCount;
            } elseif ($foundFaultsCount <= 10) {
                $nextLevelNeeded = 11 - $foundFaultsCount;
            } else {
                $nextLevelNeeded = 0; // максимальный уровень
            }

            $levelText = '';
            switch ($currentLevel) {
                case 'beginner':
                    $levelText = 'Начальный';
                    break;
                case 'medium':
                    $levelText = 'Средний';
                    break;
                case 'hard':
                    $levelText = 'Сложный';
                    break;
                case 'expert':
                    $levelText = 'Эксперт';
                    break;
                default:
                    $levelText = 'Не определен';
            }

            return response()->json([
                'success' => true,
                'level' => $currentLevel,
                'level_text' => $levelText,
                'found_faults_count' => $foundFaultsCount,
                'next_level_needed' => $nextLevelNeeded,
                'next_level_text' => $this->getNextLevelText($currentLevel)
            ]);

        } catch (\Exception $e) {
            Log::error('Error getting user level: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to get user level'
            ], 500);
        }
    }

    // Вспомогательный метод для получения текста следующего уровня
    private function getNextLevelText($currentLevel)
    {
        switch ($currentLevel) {
            case 'beginner':
                return 'Средний';
            case 'medium':
                return 'Сложный';
            case 'hard':
                return 'Эксперт';
            default:
                return 'Максимальный уровень';
        }
    }

    // Метод для создания admin пользователя
    private function ensureAdminExists()
    {
        try {
            $admin = User::where('login', 'admin')->first();

            if (!$admin) {
                User::create([
                    'login' => 'admin',
                    'password' => Hash::make('admin'),
                    'surname' => 'Администратор',
                    'name' => 'Админ',
                    'patronymic' => 'Админович',
                    'pol' => 'male',
                    'group_id' => null,
                    'profession_id' => null,
                    'role' => true,
                    'level' => null // уровень админа - null
                ]);
                Log::info('Admin user created successfully');
            }
        } catch (\Exception $e) {
            Log::error('Error creating admin user: ' . $e->getMessage());
        }
    }

    // Метод для создания типов вагонов и неисправностей
    private function ensureTypesWagonsAndMalfunctions()
    {
        try {
            // Создаем типы вагонов, если их нет
            $wagonTypes = [
                'Крытый Вагон',
                'Полувагон',
                'Платформа',
                'Цистерна',
                'Вагон хопперного типа'
            ];

            $wagonIds = [];
            foreach ($wagonTypes as $name) {
                $wagon = Types_wagon::firstOrCreate(['name' => $name]);
                $wagonIds[$name] = $wagon->id;
                Log::info('Wagon type processed: ' . $name);
            }

            // Создаем неисправности для каждого типа вагона
            $malfunctions = [
                'Крытый Вагон' => [
                    'Неисправность дверей',
                    'Неисправность дверных замков',
                    'Неисправность верхних боковых люков',
                    'Вмятины панелей кузова',
                    'Отверстия в панелях кузова',
                    'Прорубы в панелях кузова',
                    'Неисправность торцевых стенок',
                    'Отсутствие (срыв) ЗПУ',
                ],
                'Полувагон' => [
                    'Дефект спойлера',
                    'Неисправность замков люков',
                    'Неисправность лестницы',
                    'Дефект торцевой поверхности',
                    'Верхняя негабаритность',
                ],
                'Платформа' => [
                    'Неисправности боковых стоечных скоб',
                    'Неисправности торцевых стоечных скоб',
                    'Неисправность петель, запоров бортов платформы',
                    'Нарушения крепления груза',
                ],
                'Цистерна' => [
                    'Неисправность лестницы',
                    'Неисправность предохранительных клапанов',
                    'Неисправность настила',
                    'Дефект поверхности котла',
                ],
                'Вагон хопперного типа' => [
                    'Неисправность верхних и нижних загрузочных устройств',
                    'Неисправность наружная деформация',
                    'Отверстия в панелях кузова',
                    'Повреждение ЗПУ',
                ],
            ];

            foreach ($malfunctions as $wagonName => $malfunctionList) {
                $wagonId = $wagonIds[$wagonName] ?? Types_wagon::where('name', $wagonName)->first()->id;

                foreach ($malfunctionList as $malfunctionName) {
                    Malfunction::firstOrCreate([
                        'name' => $malfunctionName,
                        'types_wagon_id' => $wagonId
                    ]);
                }
            }

            Log::info('Types wagons and malfunctions initialized successfully');

        } catch (\Exception $e) {
            Log::error('Error creating types wagons and malfunctions: ' . $e->getMessage());
        }
    }

    public function index()
    {
        try {
            $users = User::with(['group', 'profession'])->get();
            return response()->json([
                'success' => true,
                'users' => $users
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting users: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function register(Request $request)
    {
        try {
            Log::info('Registration request:', $request->all());

            $isTeacher = $request->role === true || $request->role === 'teacher';

            $rules = [
                'login' => 'required|string|max:255|unique:users',
                'password' => 'required|string|min:6',
                'surname' => 'required|string|max:255',
                'name' => 'required|string|max:255',
                'patronymic' => 'nullable|string|max:255',
                'pol' => 'required|in:male,female',
                'role' => 'boolean'
            ];

            if (!$isTeacher) {
                $rules['group_name'] = 'required|string|max:255';
                $rules['profession_name'] = 'required|string|max:255';
            }

            $validated = $request->validate($rules);

            $group = null;
            $profession = null;

            if (!$isTeacher) {
                $group = Group::firstOrCreate(
                    ['name' => $request->group_name],
                    ['name' => $request->group_name]
                );

                $profession = Profession::firstOrCreate(
                    ['name' => $request->profession_name],
                    ['name' => $request->profession_name]
                );
            }

            // ИСПРАВЛЕНО: используем 'simple' вместо 'простой уровень'
            $level = $isTeacher ? null : 'simple';

            $user = User::create([
                'login' => $request->login,
                'password' => Hash::make($request->password),
                'surname' => $request->surname,
                'name' => $request->name,
                'patronymic' => $request->patronymic,
                'pol' => $request->pol,
                'group_id' => $group ? $group->id : null,
                'profession_id' => $profession ? $profession->id : null,
                'role' => $isTeacher,
                'level' => $level
            ]);

            if ($user->group) {
                $user->load(['group', 'profession']);
            }

            Log::info('User created successfully:', ['user_id' => $user->id, 'level' => $level]);

            return response()->json([
                'success' => true,
                'message' => 'User registered successfully',
                'user' => $user
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation error:', $e->errors());
            return response()->json([
                'success' => false,
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Registration error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Registration failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function login(Request $request)
    {
        try {
            $request->validate([
                'login' => 'required|string',
                'password' => 'required|string'
            ]);

            $user = User::where('login', $request->login)->first();

            if (!$user || !Hash::check($request->password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'error' => 'Неверный логин или пароль'
                ], 401);
            }

            if ($user->group) {
                $user->load(['group', 'profession']);
            }

            $roleForFrontend = $user->role ? 'teacher' : 'student';

            return response()->json([
                'success' => true,
                'user' => [
                    'id' => $user->id,
                    'login' => $user->login,
                    'surname' => $user->surname,
                    'name' => $user->name,
                    'patronymic' => $user->patronymic,
                    'pol' => $user->pol,
                    'role' => $user->role,
                    'role_text' => $roleForFrontend,
                    'group' => $user->group,
                    'profession' => $user->profession,
                    'level' => $user->level // <-- ДОБАВЬТЕ ЭТУ СТРОКУ!
                ],
                'role' => $roleForFrontend
            ]);

        } catch (\Exception $e) {
            Log::error('Login error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Ошибка входа'
            ], 500);
        }
    }
    public function getCurrentUser(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            if ($user->group) {
                $user->load(['group', 'profession']);
            }

            return response()->json([
                'success' => true,
                'user' => [
                    'id' => $user->id,
                    'login' => $user->login,
                    'surname' => $user->surname,
                    'name' => $user->name,
                    'patronymic' => $user->patronymic,
                    'pol' => $user->pol,
                    'role' => $user->role,
                    'group' => $user->group,
                    'profession' => $user->profession,
                    'level' => $user->level // <-- ДОБАВЬТЕ!
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting current user: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to get user data'
            ], 500);
        }
    }
    public function show($id)
    {
        try {
            $user = User::with(['group', 'profession'])->findOrFail($id);
            return response()->json([
                'success' => true,
                'user' => $user
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'User not found'
            ], 404);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $user = User::findOrFail($id);
            $user->update($request->only([
                'surname', 'name', 'patronymic', 'pol', 'group_id', 'profession_id'
            ]));

            if ($request->has('password') && $request->password) {
                $user->password = Hash::make($request->password);
                $user->save();
            }

            if ($user->group) {
                $user->load(['group', 'profession']);
            }

            return response()->json([
                'success' => true,
                'message' => 'User updated successfully',
                'user' => $user
            ]);

        } catch (\Exception $e) {
            Log::error('Error updating user: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to update user'
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $user = User::findOrFail($id);
            $user->delete();

            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting user: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to delete user'
            ], 500);
        }
    }

    public function getStatistics($id)
    {
        try {
            $user = User::with('statistics')->findOrFail($id);
            return response()->json([
                'success' => true,
                'statistics' => $user->statistics
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting statistics: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to get statistics'
            ], 500);
        }
    }
}
