<?php

namespace App\Http\Controllers;

use App\Jobs\SendApplicationEmail;
use App\Models\Application;
use App\Models\JobOffer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ApplicationController
{
    public function store(Request $request, string $offer)
    {
        $data = $request->validate(['message' => 'nullable|string|max:5000']);
        if (!$request->user()->onboarding_completed_at) {
            abort(403, 'Complete your profile before applying.');
        }
        $snapshot = null;
        try {
            $application = DB::transaction(function () use ($request, $offer, $data, &$snapshot) {
                $offer = JobOffer::lockForUpdate()->findOrFail($offer);
                $company = $offer->company;
                $companyUser = $company->user;
                if ($offer->status !== 'published' || !$offer->published_at || $offer->published_at->isFuture()
                    || ($offer->expires_at && $offer->expires_at->isPast()) || $company->status === 'blocked'
                    || !$companyUser || $companyUser->status !== 'active' || !$companyUser->email_verified_at) {
                    abort(409, 'This offer is no longer accepting applications.');
                }
                $candidate = $request->user()->candidateProfile()->lockForUpdate()->firstOrFail();
                if ($candidate->applications()->where('job_offer_id', $offer->id)->exists()) {
                    abort(409, 'You have already applied for this offer.');
                }
                if (!$candidate->cv_path || !Storage::exists($candidate->cv_path)) {
                    abort(422, 'Upload your CV before applying.');
                }
                $snapshot = 'uploads/applications/'.Str::uuid().'.pdf';
                if (!Storage::copy($candidate->cv_path, $snapshot)) {
                    abort(503, 'Could not save your CV. Please try again.');
                }
                $application = $candidate->applications()->create([
                    'job_offer_id' => $offer->id,
                    'cv_snapshot_path' => $snapshot,
                    'message' => $data['message'] ?? null,
                    'status' => 'pending',
                    'status_changed_by' => $request->user()->id,
                ]);
                DB::table('notifications')->insert([
                    'user_id' => $company->user_id,
                    'type' => 'new_application',
                    'application_id' => $application->id,
                    'job_offer_id' => $offer->id,
                    'data' => json_encode(['title' => $offer->title]),
                ]);
                SendApplicationEmail::dispatch($application->id);
                return $application;
            });
        } catch (\Throwable $exception) {
            if ($snapshot) {
                Storage::delete($snapshot);
            }
            throw $exception;
        }
        return response()->json($application, 201);
    }

    public function candidateIndex(Request $request)
    {
        return $request->user()->candidateProfile->applications()
            ->with(['offer.company:id,name', 'history'])->orderByDesc('id')->paginate(20);
    }

    public function companyIndex(Request $request, string $offer)
    {
        $offer = $request->user()->company->offers()->findOrFail($offer);
        $applications = $offer->applications()->with([
            'candidate:id,user_id,phone,city,summary,current_studies,study_family,linkedin,github,portfolio',
            'candidate.user:id,name,surname,second_surname,email', 'candidate.skills:id,name', 'history',
        ])->orderByDesc('id')->paginate(20);
        DB::table('notifications')->where('user_id', $request->user()->id)
            ->where('job_offer_id', $offer->id)->whereNull('read_at')->update(['read_at' => now()]);
        return response()->json(['offer' => $offer, 'applications' => $applications])->header('Cache-Control', 'private, no-store');
    }

    public function update(Request $request, string $application)
    {
        $data = $request->validate(['status' => ['required', Rule::in(['pending', 'reviewed', 'interview', 'accepted', 'rejected'])]]);
        $application = DB::transaction(function () use ($request, $application, $data) {
            $application = $this->companyApplications($request)->lockForUpdate()->findOrFail($application);
            if ($application->status === 'withdrawn') {
                abort(409, 'This application was withdrawn.');
            }
            $application->update(['status' => $data['status'], 'status_changed_by' => $request->user()->id]);
            return $application;
        });
        return $application->load('history');
    }

    public function withdraw(Request $request, string $application)
    {
        $application = DB::transaction(function () use ($request, $application) {
            $application = $request->user()->candidateProfile->applications()->lockForUpdate()->findOrFail($application);
            if (!in_array($application->status, ['pending', 'reviewed', 'interview'], true)) {
                abort(409, 'This application cannot be withdrawn.');
            }
            $application->update(['status' => 'withdrawn', 'withdrawn_at' => now(), 'status_changed_by' => $request->user()->id]);
            return $application;
        });
        return $application->load('history');
    }

    public function cv(Request $request, string $application)
    {
        $application = $this->companyApplications($request)->findOrFail($application);
        if (!Storage::exists($application->cv_snapshot_path)) {
            abort(404, 'CV not found.');
        }
        return response()->download(Storage::path($application->cv_snapshot_path), 'cv.pdf', [
            'Content-Type' => 'application/pdf',
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store',
        ]);
    }

    public function notifications(Request $request)
    {
        return DB::table('notifications')->where('user_id', $request->user()->id)
            ->whereNull('read_at')->orderByDesc('id')->limit(50)->get();
    }

    private function companyApplications(Request $request)
    {
        $company = $request->user()->company;
        return Application::whereHas('offer', function ($query) use ($company) {
            $query->where('company_id', $company->id);
        });
    }
}
