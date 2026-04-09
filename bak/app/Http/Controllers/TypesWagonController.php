<?php

namespace App\Http\Controllers;

use App\Models\Types_wagon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TypesWagonController extends Controller
{
    public function index()
    {
        try {
            $typesWagons = Types_wagon::all();
            return response()->json([
                'success' => true,
                'types_wagons' => $typesWagons
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting wagon types: ' . $e->getMessage());
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
                'name' => 'required|string|unique:types_wagons'
            ]);

            $typesWagon = Types_wagon::create([
                'name' => $request->name
            ]);

            return response()->json([
                'success' => true,
                'types_wagon' => $typesWagon
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating wagon type: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $typesWagon = Types_wagon::findOrFail($id);
            return response()->json([
                'success' => true,
                'types_wagon' => $typesWagon
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Wagon type not found'
            ], 404);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $typesWagon = Types_wagon::findOrFail($id);
            $typesWagon->update([
                'name' => $request->name
            ]);

            return response()->json([
                'success' => true,
                'types_wagon' => $typesWagon
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating wagon type: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $typesWagon = Types_wagon::findOrFail($id);
            $typesWagon->delete();

            return response()->json([
                'success' => true,
                'message' => 'Wagon type deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting wagon type: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getMalfunctions($id)
    {
        try {
            $typesWagon = Types_wagon::with('malfunctions')->findOrFail($id);
            return response()->json([
                'success' => true,
                'malfunctions' => $typesWagon->malfunctions
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
