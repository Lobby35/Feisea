<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class AdminUserController
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'role' => ['nullable', Rule::in(['candidate', 'company', 'admin'])],
            'search' => 'nullable|string|max:200',
        ]);
        $users = User::query();
        if (!empty($filters['role'])) {
            $users->where('role', $filters['role']);
        }
        if (!empty($filters['search'])) {
            $search = '%'.$filters['search'].'%';
            $users->where(function ($query) use ($search) {
                $query->where('name', 'ilike', $search)->orWhere('email', 'ilike', $search);
            });
        }
        return $users->orderByDesc('id')->paginate(20);
    }

    public function update(Request $request, string $user)
    {
        $data = $request->validate(['status' => ['required', Rule::in(['active', 'blocked'])]]);
        if ((string) $request->user()->id === $user) {
            abort(403, 'You cannot change your own account status.');
        }
        return DB::transaction(function () use ($user, $data) {
            $user = User::whereKey($user)->lockForUpdate()->firstOrFail();
            if ($data['status'] === 'active' && !$user->email_verified_at) {
                abort(422, 'The user must verify their email first.');
            }
            $user->status = $data['status'];
            $user->save();
            if ($user->status === 'blocked') {
                DB::table('sessions')->where('user_id', $user->id)->delete();
            }
            return $user;
        });
    }

    public function destroy(Request $request, string $user)
    {
        if ((string) $request->user()->id === $user) {
            abort(403, 'You cannot delete your own account.');
        }
        $paths = DB::transaction(function () use ($user) {
            $user = User::whereKey($user)->lockForUpdate()->firstOrFail();
            $paths = [];
            if ($user->role === 'candidate') {
                $profile = $user->candidateProfile()->lockForUpdate()->first();
                if ($profile) {
                    $paths = $profile->applications()->pluck('cv_snapshot_path')->all();
                    $paths[] = $profile->photo_path;
                    $paths[] = $profile->cv_path;
                }
            }
            if ($user->role === 'company') {
                $company = $user->company()->lockForUpdate()->first();
                if ($company) {
                    $company->offers()->orderBy('id')->lockForUpdate()->get();
                    $paths = DB::table('applications')->join('job_offers', 'applications.job_offer_id', '=', 'job_offers.id')
                        ->where('job_offers.company_id', $company->id)->pluck('cv_snapshot_path')->all();
                    $paths[] = $company->logo_path;
                }
            }
            $user->delete();
            return array_values(array_filter($paths));
        });
        Storage::delete($paths);
        return response()->json(['message' => 'Account deleted.']);
    }
}
