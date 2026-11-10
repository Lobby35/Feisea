<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdminCompanyController
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'status' => ['nullable', Rule::in(['pending', 'approved', 'blocked'])],
            'search' => 'nullable|string|max:200',
        ]);
        $companies = Company::with('user:id,name,email,status,email_verified_at')->withCount('offers');
        if (!empty($filters['status'])) {
            $companies->where('status', $filters['status']);
        }
        if (!empty($filters['search'])) {
            $search = '%'.$filters['search'].'%';
            $companies->where(function ($query) use ($search) {
                $query->where('name', 'ilike', $search)->orWhereHas('user', function ($user) use ($search) {
                    $user->where('email', 'ilike', $search);
                });
            });
        }
        $result = $companies->orderByDesc('id')->paginate(20);
        foreach ($result as $company) {
            $company->makeHidden(['logo_path']);
        }
        return $result;
    }

    public function show(Request $request, string $company)
    {
        $company = Company::with('user:id,name,email,status,email_verified_at')->withCount('offers')->findOrFail($company);
        $company->makeHidden(['logo_path']);
        DB::table('notifications')->where('user_id', $request->user()->id)->where('company_id', $company->id)
            ->whereNull('read_at')->update(['read_at' => now()]);
        return $company;
    }

    public function update(Request $request, string $company)
    {
        $data = $request->validate(['status' => ['required', Rule::in(['pending', 'approved', 'blocked'])]]);
        $company = DB::transaction(function () use ($request, $company, $data) {
            $company = Company::whereKey($company)->lockForUpdate()->firstOrFail();
            $company->status = $data['status'];
            $company->reviewed_by = $request->user()->id;
            $company->reviewed_at = now();
            if ($company->status === 'approved') {
                $company->verified_at = now();
            } else {
                $company->verified_at = null;
                DB::table('sessions')->where('user_id', $company->user_id)->delete();
            }
            $company->save();
            return $company;
        });
        return $this->show($request, (string) $company->id);
    }
}
