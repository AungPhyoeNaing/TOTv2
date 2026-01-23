<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserReport extends Model
{
    use HasFactory;

    // Define the fillable fields (mass assignment)
    protected $fillable = [
        'reporting_user_id',
        'reported_user_id',
        'reason',
        'status', // Although status defaults to 'pending', you might want to allow setting it explicitly in some cases
    ];

    // Define the guarded fields (opposite of fillable, optional if using fillable)
    // protected $guarded = []; // Default is ['id', 'created_at', 'updated_at'] if $fillable is empty

    // Optional: Define relationships if needed (e.g., to the User model)
    // public function reportingUser() { ... }
    // public function reportedUser() { ... }

    public function reportingUser()
    {
        return $this->belongsTo(\App\Models\User::class, 'reporting_user_id', 'id');
    }

    // Define the relationship to the user being reported
    public function reportedUser()
    {
        return $this->belongsTo(\App\Models\User::class, 'reported_user_id', 'id');
    }
}