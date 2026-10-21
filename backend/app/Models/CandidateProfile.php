<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CandidateProfile extends Model
{
    protected $fillable = [
        'phone', 'city', 'summary', 'current_studies', 'availability',
        'linkedin', 'github', 'portfolio', 'mobility',
        'preferred_modality', 'preferred_schedule',
        'photo_path', 'cv_path', 'cv_original_name', 'cv_mime_type', 'cv_size_bytes',
    ];
}
