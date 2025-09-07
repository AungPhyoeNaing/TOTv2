<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class MediaController extends Controller
{
    public function upload(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => [
                'required',
                'file',
                'max:20480', // 20MB
                'mimes:jpg,jpeg,png,gif,webp,mp3,wav,ogg,mp4,mov,avi,wmv,webm'
            ]
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $file = $request->file('file');

        $extension = $file->getClientOriginalExtension();
        $filename = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME));
        $uniqueFilename = $filename . '_' . time() . '.' . $extension;

        $typeFolder = match (true) {
            in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'webp']) => 'image',
            in_array($extension, ['mp3', 'wav', 'ogg']) => 'audio',
            in_array($extension, ['mp4', 'mov', 'avi', 'wmv', 'webm']) => 'video',
            default => 'others'
        };

        $path = $file->storeAs("uploads/{$typeFolder}", $uniqueFilename, 'public');

        return response()->json([
            'success' => true,
            'data' => [
                'url' => url(Storage::url($path)),
                'type' => $typeFolder, // 'image', 'audio', 'video'
                'mime' => $file->getMimeType(),
                'size' => $file->getSize(),
            ]
        ]);
    }
}