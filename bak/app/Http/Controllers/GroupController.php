<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Group;

class GroupController extends Controller
{
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
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function createGroup(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|unique:groups'
            ]);

            $group = Group::create([
                'name' => $request->name
            ]);

            return response()->json([
                'success' => true,
                'group' => $group
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateGroup(Request $request, $id)
    {
        try {
            $group = Group::findOrFail($id);
            $group->update(['name' => $request->name]);

            return response()->json([
                'success' => true,
                'group' => $group
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function deleteGroup($id)
    {
        try {
            $group = Group::findOrFail($id);
            $group->delete();

            return response()->json([
                'success' => true,
                'message' => 'Group deleted'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
