<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CandidateProfile extends Model
{
    protected $fillable = [
        'phone', 'city', 'summary', 'current_studies', 'study_family',
        'linkedin', 'github', 'portfolio', 'mobility',
        'preferred_modality', 'preferred_schedule',
        'photo_path', 'cv_path', 'cv_original_name', 'cv_mime_type', 'cv_size_bytes',
    ];

    public function skills()
    {
        return $this->belongsToMany(Skill::class, 'candidate_skills', 'candidate_id', 'skill_id')->withTimestamps();
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function applications()
    {
        return $this->hasMany(Application::class, 'candidate_id');
    }
}
