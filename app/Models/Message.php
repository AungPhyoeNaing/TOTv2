<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    use HasFactory;

    protected $fillable = [
        'sender_id',
        'recipient_id', // Or 'chat_id'
        'content', 
        'content',
    ];

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function recipient()
    {
         return $this->belongsTo(User::class, 'recipient_id');
    }
    // If using chat_id:
    // public function chat()
    // {
    //     return $this->belongsTo(Chat::class);
    // }
}