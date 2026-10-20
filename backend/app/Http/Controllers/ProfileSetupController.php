<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Rules\AccountRules;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ProfileSetupController
{
    public function complete(Request $request, ProfileController $profiles)
    {
        DB::transaction(function () use ($request) {
            $user = User::whereKey($request->user()->id)->lockForUpdate()->firstOrFail();
            if ($user->onboarding_completed_at) return;
            validator($user->toArray(), AccountRules::names())->validate();
            $candidate = $user->role === 'candidate';
            $profile = DB::table($candidate ? 'candidate_profiles' : 'companies')
                ->where('user_id', $user->id)->lockForUpdate()->first();
            abort_unless($profile, 404, 'Profile not found.');
            $required = $candidate ? ['photo_path' => 'Upload a profile photo.', 'cv_path' => 'Upload your CV.'] : ['logo_path' => 'Upload a company logo.'];
            $errors = [];
            foreach ($required as $field => $message) {
                if (!$profile->{$field} || !Storage::exists($profile->{$field})) $errors[$field] = $message;
            }
            if (!$candidate && !trim($profile->name)) $errors['company_name'] = 'Enter the company name.';
            if ($errors) throw ValidationException::withMessages($errors);
            $user->forceFill(['onboarding_completed_at' => now()])->save();
        });
        $user = $request->user()->fresh();
        $request->setUserResolver(fn () => $user);
        return $profiles->show($request);
    }
}
