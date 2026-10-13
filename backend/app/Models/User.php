<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    protected $fillable = [
        'name', 'email', 'password_hash', 'role', 'status', 'preferred_locale',
    ];

    protected $hidden = ['password_hash'];

    protected function casts(): array
    {
        return [
            'id' => 'string',
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
        ];
    }
}
