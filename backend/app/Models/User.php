<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    protected $authPasswordName = 'password_hash';
    protected $fillable = [
        'name', 'surname', 'second_surname', 'email', 'password_hash', 'role', 'status', 'preferred_locale',
    ];

    protected $hidden = ['password_hash'];

    protected function casts(): array
    {
        return [
            'id' => 'string',
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'onboarding_completed_at' => 'datetime',
        ];
    }
}
