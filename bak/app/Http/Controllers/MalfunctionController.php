<?php

namespace App\Http\Controllers;

use App\Models\Malfunction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MalfunctionController extends Controller
{
    public function index()
    {
        try {
            $malfunctions = Malfunction::all();
            return response()->json([
                'success' => true,
                'malfunctions' => $malfunctions
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting malfunctions: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|unique:malfunctions',
                'types_wagon_id' => 'required|exists:types_wagons,id'
            ]);

            $malfunction = Malfunction::create([
                'name' => $request->name,
                'types_wagon_id' => $request->types_wagon_id
            ]);

            return response()->json([
                'success' => true,
                'malfunction' => $malfunction
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating malfunction: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $malfunction = Malfunction::findOrFail($id);
            return response()->json([
                'success' => true,
                'malfunction' => $malfunction
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Malfunction not found'
            ], 404);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $malfunction = Malfunction::findOrFail($id);
            $malfunction->update([
                'name' => $request->name,
                'types_wagon_id' => $request->types_wagon_id
            ]);

            return response()->json([
                'success' => true,
                'malfunction' => $malfunction
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating malfunction: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $malfunction = Malfunction::findOrFail($id);
            $malfunction->delete();

            return response()->json([
                'success' => true,
                'message' => 'Malfunction deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting malfunction: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getByWagonType($wagonTypeId)
    {
        try {
            $malfunctions = Malfunction::where('types_wagon_id', $wagonTypeId)->get();
            return response()->json([
                'success' => true,
                'malfunctions' => $malfunctions
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting malfunctions by wagon type: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
