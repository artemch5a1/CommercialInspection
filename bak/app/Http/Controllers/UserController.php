<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Group;
use App\Models\Profession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    // Получить всех пользователей (для учителя)
    public function index(Request $request)
    {
        $users = User::with(['group', 'profession'])->get();

        return response()->json([
            'success' => true,
            'users' => $users->map(function ($user) {
                return [
                    'id' => $user->id,
                    'lastName' => $user->surname,
                    'firstName' => $user->name,
                    'patronymic' => $user->patronymic,
                    'group' => $user->group?->name ?? '',
                    'profession' => $user->profession?->name ?? '',
                    'login' => $user->login,
                    'gender' => $user->pol,
                    'role' => $user->role
                ];
            })
        ]);
    }

    // Получить конкретного пользователя
    public function show($id)
    {
        $user = User::with(['group', 'profession'])->find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Пользователь не найден'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'lastName' => $user->surname,
                'firstName' => $user->name,
                'patronymic' => $user->patronymic,
                'group' => $user->group?->name ?? '',
                'groupId' => $user->group?->id,
                'profession' => $user->profession?->name ?? '',
                'professionId' => $user->profession?->id,
                'login' => $user->login,
                'gender' => $user->pol,
                'role' => $user->role
            ]
        ]);
    }

    // Регистрация нового пользователя
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'login' => 'required|string|max:255|unique:users,login',
            'password' => 'required|string|min:6',
            'lastName' => 'required|string|max:255',
            'firstName' => 'required|string|max:255',
            'patronymic' => 'nullable|string|max:255',
            'gender' => 'required|in:male,female',
            'group' => 'nullable|string|exists:groups,name',
            'profession' => 'nullable|string|exists:professions,name',
            'role' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Находим ID группы по имени
        $groupId = null;
        if ($request->group) {
            $group = Group::where('name', $request->group)->first();
            $groupId = $group?->id;
        }

        // Находим ID профессии по имени
        $professionId = null;
        if ($request->profession) {
            $profession = Profession::where('name', $request->profession)->first();
            $professionId = $profession?->id;
        }

        $user = User::create([
            'name' => $request->firstName,
            'surname' => $request->lastName,
            'patronymic' => $request->patronymic ?? '',
            'login' => $request->login,
            'password' => Hash::make($request->password),
            'pol' => $request->gender,
            'id_group' => $groupId,
            'id_profession' => $professionId,
            'role' => $request->role ?? 0
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Пользователь успешно зарегистрирован',
            'user' => [
                'id' => $user->id,
                'lastName' => $user->surname,
                'firstName' => $user->name,
                'patronymic' => $user->patronymic,
                'group' => $user->group?->name ?? '',
                'profession' => $user->profession?->name ?? '',
                'login' => $user->login,
                'gender' => $user->pol
            ]
        ], 201);
    }

    // Обновление пользователя
    public function update(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Пользователь не найден'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'login' => 'required|string|max:255|unique:users,login,' . $id,
            'password' => 'nullable|string|min:6',
            'lastName' => 'required|string|max:255',
            'firstName' => 'required|string|max:255',
            'patronymic' => 'nullable|string|max:255',
            'gender' => 'required|in:male,female',
            'group' => 'nullable|string|exists:groups,name',
            'profession' => 'nullable|string|exists:professions,name',
            'role' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        // Находим ID группы по имени
        $groupId = null;
        if ($request->group) {
            $group = Group::where('name', $request->group)->first();
            $groupId = $group?->id;
        }

        // Находим ID профессии по имени
        $professionId = null;
        if ($request->profession) {
            $profession = Profession::where('name', $request->profession)->first();
            $professionId = $profession?->id;
        }

        $user->update([
            'name' => $request->firstName,
            'surname' => $request->lastName,
            'patronymic' => $request->patronymic ?? '',
            'login' => $request->login,
            'pol' => $request->gender,
            'id_group' => $groupId,
            'id_profession' => $professionId,
            'role' => $request->role ?? $user->role
        ]);

        if ($request->password) {
            $user->update(['password' => Hash::make($request->password)]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Данные пользователя обновлены',
            'user' => [
                'id' => $user->id,
                'lastName' => $user->surname,
                'firstName' => $user->name,
                'patronymic' => $user->patronymic,
                'group' => $user->group?->name ?? '',
                'profession' => $user->profession?->name ?? '',
                'login' => $user->login,
                'gender' => $user->pol
            ]
        ]);
    }

    // Удаление пользователя
    public function destroy($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Пользователь не найден'
            ], 404);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Пользователь удален'
        ]);
    }

    // Получить статистику пользователя
    public function getStatistics($id)
    {
        $user = User::with(['statistics'])->find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Пользователь не найден'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'statistics' => $user->statistics
        ]);
    }
}
