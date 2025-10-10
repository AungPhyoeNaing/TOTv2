<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Post extends Model
{
    use HasFactory;

    // Add 'category_id' to the fillable array to allow mass assignment
    protected $fillable = [
        'body',
        'shared_post_id',
        'media_url',
        'media_type',
        'category_id', // Add this line
        'user_id',     // Add this if it's not already there and you intend to set it via mass assignment
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Define the relationship: A Post belongs to a Category (optional)
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class); // Assumes Category model exists
    }

    public function reactions()
    {
        return $this->hasMany(Reaction::class);
    }

    /**
     * Get the comments for the post.
     */
    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    /**
     * Get the original post if this post is a share.
     */
    public function sharedPost()
    {
        return $this->belongsTo(Post::class, 'shared_post_id');
    }

    /**
     * Get the posts that share this post.
     */
    public function shares()
    {
        return $this->hasMany(Post::class, 'shared_post_id');
    }

    // Example accessor to get category name (optional)
    public function getCategoryNameAttribute()
    {
        return $this->category ? $this->category->name : 'Uncategorized'; // Or null, or a default
    }
}