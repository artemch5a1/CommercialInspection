<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Topic;

class TopicController extends Controller
{
    public function getTopics()
    {
        try {
            $topics = Topic::all();
            return response()->json([
                'success' => true,
                'topics' => $topics
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function createTopic(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|unique:topics'
            ]);

            $topic = Topic::create([
                'name' => $request->name
            ]);

            return response()->json([
                'success' => true,
                'topic' => $topic
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateTopic(Request $request, $id)
    {
        try {
            $topic = Topic::findOrFail($id);
            $topic->update(['name' => $request->name]);

            return response()->json([
                'success' => true,
                'topic' => $topic
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function deleteTopic($id)
    {
        try {
            $topic = Topic::findOrFail($id);
            $topic->delete();

            return response()->json([
                'success' => true,
                'message' => 'Topic deleted'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
