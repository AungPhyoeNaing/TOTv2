<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Post;

class PostController extends Controller
{
    public function index(){
        $posts = POST::with('user')->latest()->get();    
        return $posts;
    }

    public function store(Request $request){
        $request->validate([
            'body' => 'required|string|max:1000'
        ]);

        $post = $request->user()->posts()->create(
            [
                'body' => $request->body
            ]
            );
        
            return response()->json($post->load('user'), 201);
    }
}
