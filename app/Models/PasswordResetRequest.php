<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PasswordResetRequest extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'email',
        'recovery_email',
        'account_creation_date',
        'message',
        'status',
        'admin_id',
        'processed_at',
        // NEW: Add the verification code fields to fillable
        'verification_code',
        'verification_code_expires_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'processed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        // NEW: Cast the verification code expiry to a datetime
        'verification_code_expires_at' => 'datetime',
    ];

    /**
     * Get the admin who processed this request.
     */
    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    /**
     * Get the user associated with this password reset request.
     * Assumes the 'email' column in password_reset_requests matches the 'email' column in users table.
     */
    public function user(): BelongsTo
    {
        // Foreign key in PRR table -> email
        // Foreign key in User table -> email
        return $this->belongsTo(User::class, 'email', 'email');
    }
}