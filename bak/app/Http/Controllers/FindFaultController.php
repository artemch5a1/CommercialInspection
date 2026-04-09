<?php

namespace App\Http\Controllers;

use App\Models\Find_fault;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FindFaultController extends Controller
{
    public function index()
    {
        try {
            $findFaults = Find_fault::with(['user', 'taskMalfunction.malfunction', 'statistic'])
                ->where('user_id', Auth::id())
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'find_faults' => $findFaults
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ошибка загрузки данных'
            ], 500);
        }
    }

    public function create()
    {
        //
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'task_malfunction_id' => 'required|exists:task_malfunctions,id',
                'statistic_id' => 'required|exists:statistics,id',
                'right' => 'required|in:0,1',
                'comment' => 'nullable|string'
            ]);

            $findFault = Find_fault::create([
                'user_id' => Auth::id(),
                'task_malfunction_id' => $validated['task_malfunction_id'],
                'statistic_id' => $validated['statistic_id'],
                'right' => $validated['right'],
                'comment' => $validated['comment'] ?? ''
            ]);

            return response()->json([
                'success' => true,
                'find_fault' => $findFault
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ошибка сохранения: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show(Find_fault $findFault)
    {
        try {
            $findFault->load(['user', 'taskMalfunction.malfunction', 'statistic']);

            return response()->json([
                'success' => true,
                'find_fault' => $findFault
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ошибка загрузки данных'
            ], 500);
        }
    }

    public function edit(Find_fault $findFault)
    {
        //
    }

    public function update(Request $request, Find_fault $findFault)
    {
        //
    }

    public function destroy(Find_fault $findFault)
    {
        //
    }

    // Получение неисправностей по статистике
    public function getByStatistic($statisticId)
    {
        try {
            $findFaults = Find_fault::with(['taskMalfunction.malfunction'])
                ->where('statistic_id', $statisticId)
                ->where('user_id', Auth::id())
                ->get();

            return response()->json([
                'success' => true,
                'find_faults' => $findFaults
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Ошибка загрузки данных'
            ], 500);
        }
    }
}
