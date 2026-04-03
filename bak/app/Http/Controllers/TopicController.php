<?php

namespace App\Http\Controllers;

use App\Models\Topic;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TopicController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function getTopics()
    {
        return response()->json([
            'success' => true,
            'topics' => Topic::all()
        ]);
    }

    public function createTopic(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:topics,name'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $topic = Topic::create(['name' => $request->name]);
        return response()->json(['success' => true, 'topic' => $topic], 201);
    }

    public function updateTopic(Request $request, $id)
    {
        $topic = Topic::find($id);
        if (!$topic) {
            return response()->json(['success' => false, 'message' => 'Тема не найдена'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:topics,name,' . $id
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $topic->update(['name' => $request->name]);
        return response()->json(['success' => true, 'topic' => $topic]);
    }

    public function deleteTopic($id)
    {
        $topic = Topic::find($id);
        if (!$topic) {
            return response()->json(['success' => false, 'message' => 'Тема не найдена'], 404);
        }
        $topic->delete();
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
    public function show(Topic $topic)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Topic $topic)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Topic $topic)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Topic $topic)
    {
        //
    }
}
