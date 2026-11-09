<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Application extends Model
{
    protected $fillable = ['job_offer_id', 'cv_snapshot_path', 'message', 'status', 'status_changed_by', 'withdrawn_at'];
    protected $hidden = ['cv_snapshot_path'];

    public function offer()
    {
        return $this->belongsTo(JobOffer::class, 'job_offer_id');
    }

    public function candidate()
    {
        return $this->belongsTo(CandidateProfile::class, 'candidate_id');
    }

    public function history()
    {
        return $this->hasMany(ApplicationStatus::class)->orderBy('id');
    }
}
