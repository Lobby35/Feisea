<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JobOffer extends Model
{
    protected $fillable = [
        'title', 'description', 'category_id', 'minimum_qualification_id', 'responsibilities',
        'requirements', 'mandatory_requirements', 'desirable_requirements', 'minimum_experience_years',
        'offer_type', 'location', 'address', 'modality', 'contract_type', 'schedule', 'working_hours',
        'hours_per_week', 'duration_months', 'salary_min', 'salary_max', 'salary_period',
        'immediate_start', 'start_date', 'expires_at', 'status', 'published_at',
    ];

    protected function casts(): array
    {
        return ['immediate_start' => 'boolean', 'published_at' => 'datetime', 'expires_at' => 'datetime'];
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function applications()
    {
        return $this->hasMany(Application::class);
    }

    public function skills()
    {
        return $this->belongsToMany(Skill::class, 'job_offer_skills')->withTimestamps();
    }

    public function languages()
    {
        return $this->belongsToMany(Language::class, 'job_offer_languages')->withPivot('required_level')->withTimestamps();
    }
}
