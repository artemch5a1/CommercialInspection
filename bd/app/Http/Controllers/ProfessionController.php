<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Profession;

class ProfessionController extends Controller
{
    public function getProfessions()
    {
        try {
            $professions = Profession::all();
            return response()->json([
                'success' => true,
                'professions' => $professions
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function createProfession(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|unique:professions'
            ]);

            $profession = Profession::create([
                'name' => $request->name
            ]);

            return response()->json([
                'success' => true,
                'profession' => $profession
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateProfession(Request $request, $id)
    {
        try {
            $profession = Profession::findOrFail($id);
            $profession->update(['name' => $request->name]);

            return response()->json([
                'success' => true,
                'profession' => $profession
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function deleteProfession($id)
    {
        try {
            $profession = Profession::findOrFail($id);
            $profession->delete();

            return response()->json([
                'success' => true,
                'message' => 'Profession deleted'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
