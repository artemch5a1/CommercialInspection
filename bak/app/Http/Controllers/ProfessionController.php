<?php

namespace App\Http\Controllers;

use App\Models\Profession;
use Illuminate\Http\Request;

class ProfessionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function getProfessions()
    {
        return response()->json([
            'success' => true,
            'professions' => Profession::all()
        ]);
    }

    public function createProfession(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:professions,name'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $profession = Profession::create(['name' => $request->name]);
        return response()->json(['success' => true, 'profession' => $profession], 201);
    }

    public function updateProfession(Request $request, $id)
    {
        $profession = Profession::find($id);
        if (!$profession) {
            return response()->json(['success' => false, 'message' => 'Профессия не найдена'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:professions,name,' . $id
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $profession->update(['name' => $request->name]);
        return response()->json(['success' => true, 'profession' => $profession]);
    }

    public function deleteProfession($id)
    {
        $profession = Profession::find($id);
        if (!$profession) {
            return response()->json(['success' => false, 'message' => 'Профессия не найдена'], 404);
        }
        $profession->delete();
        return response()->json(['success' => true]);
    }
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(Profession $profession)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Profession $profession)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Profession $profession)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Profession $profession)
    {
        //
    }
}
