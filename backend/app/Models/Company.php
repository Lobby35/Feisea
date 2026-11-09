<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    protected $fillable = [
        'name', 'description', 'website', 'contact_email',
        'phone', 'city', 'address', 'logo_path',
    ];
    public function offers()
    {
        return $this->hasMany(JobOffer::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
