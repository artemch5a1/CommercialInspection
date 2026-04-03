<?php

namespace App\Http\Controllers;

use App\Models\Group;
use Illuminate\Http\Request;

class GroupController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function getGroups()
    {
        try {
            $groups = Group::all();
            return response()->json([
                'success' => true,
                'groups' => $groups
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function createGroup(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255|unique:groups,name'
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $group = Group::create(['name' => $request->name]);
            return response()->json(['success' => true, 'group' => $group], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function updateGroup(Request $request, $id)
    {
        try {
            $group = Group::find($id);
            if (!$group) {
                return response()->json(['success' => false, 'message' => 'Группа не найдена'], 404);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255|unique:groups,name,' . $id
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $group->update(['name' => $request->name]);
            return response()->json(['success' => true, 'group' => $group]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function deleteGroup($id)
    {
        try {
            $group = Group::find($id);
            if (!$group) {
                return response()->json(['success' => false, 'message' => 'Группа не найдена'], 404);
            }
            $group->delete();
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
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
    public function show(Group $group)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Group $group)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Group $group)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Group $group)
    {
        //
    }
}
