<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MessageController extends Controller
{
    public function index($userId)
    {
        $authUserId = Auth::id();

        // Fetch messages between authenticated user and the specified user
        $messages = Message::where(function($query) use ($authUserId, $userId) {
            $query->where('sender_id', $authUserId)
                  ->where('recipient_id', $userId);
        })->orWhere(function($query) use ($authUserId, $userId) {
            $query->where('sender_id', $userId)
                  ->where('recipient_id', $authUserId);
        })->with(['sender', 'recipient']) // Eager load user data
          ->orderBy('created_at')
          ->get();

        return response()->json($messages);
    }

    public function store(Request $request)
    {
        $request->validate([
            'recipient_id' => 'required|exists:users,id',
            'content' => 'required|string',
            // 'chat_id' => 'required|exists:chats,id', // If using chat rooms
        ]);

        $message = Message::create([
            'sender_id' => Auth::id(),
            'recipient_id' => $request->recipient_id,
            'content' => $request->input('content'),
            // 'chat_id' => $request->chat_id,
        ]);

        // Load relationships for the response
        $message->load(['sender', 'recipient']);

        return response()->json($message, 201); // Return created message
    }
}