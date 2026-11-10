<?php

namespace App\Http\Controllers;

use App\Models\JobOffer;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class JobOfferController
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'search' => 'nullable|string|max:200',
            'location' => 'nullable|string|max:200',
            'category_id' => 'nullable|integer',
            'company_id' => 'nullable|integer',
            'modality' => ['nullable', Rule::in(['onsite', 'hybrid', 'remote'])],
            'offer_type' => ['nullable', Rule::in(['job', 'internship', 'collaboration'])],
            'contract_type' => ['nullable', Rule::in(['permanent', 'temporary', 'internship', 'freelance', 'training', 'other'])],
        ]);
        $offers = $this->publishedOffers()->with('company:id,name');
        foreach (['location', 'category_id', 'company_id', 'modality', 'offer_type', 'contract_type'] as $field) {
            if (!empty($filters[$field])) {
                $offers->where($field, $filters[$field]);
            }
        }
        if (!empty($filters['search'])) {
            $search = '%'.$filters['search'].'%';
            $offers->where(function ($query) use ($search) {
                $query->where('title', 'ilike', $search)->orWhere('description', 'ilike', $search)
                    ->orWhereHas('company', function ($company) use ($search) {
                        $company->where('name', 'ilike', $search);
                    });
            });
        }
        return $offers->orderByDesc('published_at')->orderByDesc('id')->paginate(20);
    }

    public function show(string $offer)
    {
        return $this->publishedOffers()->with(['company:id,name,description,website,city', 'skills:id,name', 'languages:id,name'])
            ->findOrFail($offer);
    }

    public function companyIndex(Request $request)
    {
        return $request->user()->company->offers()->withCount('applications')->orderByDesc('id')->paginate(20);
    }

    public function companyShow(Request $request, string $offer)
    {
        return $request->user()->company->offers()->with(['skills:id,name', 'languages:id,name'])->findOrFail($offer);
    }

    public function store(Request $request)
    {
        $this->checkSetup($request);
        $data = $this->validateOffer($request);
        $offer = DB::transaction(function () use ($request, $data) {
            $skills = $data['skill_ids'];
            $languages = $data['languages'];
            unset($data['skill_ids'], $data['languages']);
            $offer = $request->user()->company->offers()->create($data);
            if ($offer->status === 'published') {
                $offer->published_at = now();
            }
            if ($offer->status === 'closed') {
                $offer->closed_at = now();
            }
            $offer->save();
            $this->saveRequirements($offer, $skills, $languages);
            return $offer;
        });
        return response()->json($offer->load(['skills:id,name', 'languages:id,name']), 201);
    }

    public function update(Request $request, string $offer)
    {
        $this->checkSetup($request);
        $data = $this->validateOffer($request);
        unset($data['published_at']);
        $offer = DB::transaction(function () use ($request, $offer, $data) {
            $offer = $request->user()->company->offers()->lockForUpdate()->findOrFail($offer);
            $skills = $data['skill_ids'];
            $languages = $data['languages'];
            unset($data['skill_ids'], $data['languages']);
            $offer->fill($data);
            if ($offer->status === 'published' && !$offer->published_at) {
                $offer->published_at = now();
            }
            if ($offer->status === 'closed') {
                $offer->closed_at = now();
            } else {
                $offer->closed_at = null;
            }
            $offer->save();
            $this->saveRequirements($offer, $skills, $languages);
            return $offer;
        });
        return $offer->load(['skills:id,name', 'languages:id,name']);
    }

    public function destroy(Request $request, string $offer)
    {
        $paths = DB::transaction(function () use ($request, $offer) {
            $offer = $request->user()->company->offers()->lockForUpdate()->findOrFail($offer);
            $paths = $offer->applications()->pluck('cv_snapshot_path')->all();
            DB::table('notifications')->where('job_offer_id', $offer->id)->delete();
            $offer->delete();
            return $paths;
        });
        Storage::delete($paths);
        return response()->json(['message' => 'Offer deleted.']);
    }

    private function publishedOffers()
    {
        return JobOffer::where('status', 'published')->where('published_at', '<=', now())
            ->where(function ($query) {
                $query->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })->whereHas('company', function ($query) {
                $query->where('status', 'approved')->whereHas('user', function ($user) {
                    $user->where('status', 'active')->whereNotNull('email_verified_at');
                });
            });
    }

    private function checkSetup(Request $request)
    {
        if (!$request->user()->onboarding_completed_at) {
            abort(403, 'Complete your profile before posting an offer.');
        }
    }

    private function validateOffer(Request $request): array
    {
        $townData = json_decode(file_get_contents(resource_path('data/municipalities.json')), true);
        $townNames = array_column($townData['municipalities'], 'name');
        $data = $request->validate([
            'title' => 'required|string|max:200',
            'description' => 'required|string|max:20000',
            'category_id' => ['required', 'integer', Rule::exists('categories', 'id')->where('active', true)],
            'minimum_qualification_id' => ['nullable', 'integer', Rule::exists('qualifications', 'id')->where('active', true)],
            'responsibilities' => 'nullable|string|max:10000',
            'requirements' => 'nullable|string|max:10000',
            'mandatory_requirements' => 'nullable|string|max:10000',
            'desirable_requirements' => 'nullable|string|max:10000',
            'minimum_experience_years' => 'nullable|numeric|min:0|max:99.9',
            'offer_type' => ['required', Rule::in(['job', 'internship', 'collaboration'])],
            'location' => ['required', Rule::in($townNames)],
            'address' => 'nullable|string|max:255',
            'modality' => ['required', Rule::in(['onsite', 'hybrid', 'remote'])],
            'contract_type' => ['required', Rule::in(['permanent', 'temporary', 'internship', 'freelance', 'training', 'other'])],
            'schedule' => ['required', Rule::in(['full_time', 'part_time', 'flexible'])],
            'working_hours' => 'nullable|string|max:2000',
            'hours_per_week' => 'nullable|numeric|gt:0|max:168',
            'duration_months' => 'nullable|integer|min:1|max:1200',
            'salary_min' => 'nullable|numeric|min:0|max:9999999999.99',
            'salary_max' => 'nullable|numeric|min:0|max:9999999999.99',
            'salary_period' => ['required', Rule::in(['hour', 'month', 'year'])],
            'immediate_start' => 'required|boolean',
            'start_date' => 'nullable|date_format:Y-m-d',
            'expires_at' => 'nullable|date',
            'status' => ['required', Rule::in(['draft', 'published', 'closed'])],
            'skill_ids' => 'present|array|max:20',
            'skill_ids.*' => ['integer', 'distinct', Rule::exists('skills', 'id')->where('active', true)],
            'languages' => 'present|array|max:20',
            'languages.*.id' => ['required', 'integer', 'distinct', Rule::exists('languages', 'id')->where('active', true)],
            'languages.*.level' => ['required', Rule::in(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])],
        ]);
        if (isset($data['salary_min'], $data['salary_max']) && $data['salary_max'] < $data['salary_min']) {
            throw ValidationException::withMessages(['salary_max' => 'Maximum salary must be at least the minimum salary.']);
        }
        if ($data['status'] === 'published' && !empty($data['expires_at']) && now()->gte(Carbon::parse($data['expires_at']))) {
            throw ValidationException::withMessages(['expires_at' => 'Choose a future application deadline.']);
        }
        if ($data['immediate_start']) {
            $data['start_date'] = null;
        }
        // Published offers need their timestamp in the initial INSERT too.
        if ($data['status'] === 'published') {
            $data['published_at'] = now();
        }
        return $data;
    }

    private function saveRequirements(JobOffer $offer, array $skills, array $languages)
    {
        $offer->skills()->sync($skills);
        $levels = [];
        foreach ($languages as $language) {
            $levels[$language['id']] = ['required_level' => $language['level']];
        }
        $offer->languages()->sync($levels);
    }
}
