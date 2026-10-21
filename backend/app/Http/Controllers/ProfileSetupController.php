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
            if ($user->onboarding_completed_at) {
                return;
            }

            if ($user->role === 'candidate') {
                validator($user->toArray(), AccountRules::names())->validate();
                $profile = $user->candidateProfile()->lockForUpdate()->first();
            } else {
                $profile = $user->company()->lockForUpdate()->first();
            }

            if (!$profile) {
                abort(404, 'Profile not found.');
            }

            $errors = [];
            if ($user->role === 'candidate') {
                if (!$profile->photo_path || !Storage::exists($profile->photo_path)) {
                    $errors['photo_path'] = 'Upload a profile photo.';
                }
                if (!$profile->cv_path || !Storage::exists($profile->cv_path)) {
                    $errors['cv_path'] = 'Upload your CV.';
                }
            } else {
                if (!$profile->logo_path || !Storage::exists($profile->logo_path)) {
                    $errors['logo_path'] = 'Upload a company logo.';
                }
                if (!trim($profile->name)) {
                    $errors['company_name'] = 'Enter the company name.';
                }
            }

            if (!empty($errors)) {
                throw ValidationException::withMessages($errors);
            }

            $user->onboarding_completed_at = now();
            $user->save();
        });

        $user = $request->user()->fresh();
        $request->setUserResolver(function () use ($user) {
            return $user;
        });

        return $profiles->show($request);
    }
}
