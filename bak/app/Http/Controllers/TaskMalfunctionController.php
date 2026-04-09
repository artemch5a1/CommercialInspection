<?php

namespace App\Http\Controllers;

use App\Models\Task_Malfunction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TaskMalfunctionController extends Controller
{
    public function index()
    {
        try {
            $taskMalfunctions = Task_Malfunction::with(['task', 'malfunction'])->get();
            return response()->json([
                'success' => true,
                'task_malfunctions' => $taskMalfunctions
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting task malfunctions: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to get task malfunctions'
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'task_id' => 'required|exists:tasks,id',
                'malfunction_id' => 'required|exists:malfunctions,id'
            ]);

            $taskMalfunction = Task_Malfunction::create([
                'task_id' => $request->task_id,
                'malfunction_id' => $request->malfunction_id
            ]);

            return response()->json([
                'success' => true,
                'task_malfunction' => $taskMalfunction
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating task malfunction: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to create task malfunction'
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $taskMalfunction = Task_Malfunction::with(['task', 'malfunction'])->findOrFail($id);
            return response()->json([
                'success' => true,
                'task_malfunction' => $taskMalfunction
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Task malfunction not found'
            ], 404);
        }
    }

    public function destroy($id)
    {
        try {
            $taskMalfunction = Task_Malfunction::findOrFail($id);
            $taskMalfunction->delete();

            return response()->json([
                'success' => true,
                'message' => 'Task malfunction deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting task malfunction: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to delete task malfunction'
            ], 500);
        }
    }

    public function getByTask($taskId)
    {
        try {
            $taskMalfunctions = Task_Malfunction::where('task_id', $taskId)
                ->with('malfunction')
                ->get();

            return response()->json([
                'success' => true,
                'malfunctions' => $taskMalfunctions->pluck('malfunction')
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting malfunctions by task: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to get malfunctions'
            ], 500);
        }
    }
}
