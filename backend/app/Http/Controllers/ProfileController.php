<?php

namespace App\Http\Controllers;

use App\Rules\AccountRules;
use Illuminate\Http\Request;
use Illuminate\Process\Exceptions\ProcessTimedOutException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ProfileController
{
    public function show(Request $request)
    {
        $profile = $this->profile($request)->toArray();
        $photoUrl = null;
        $cvUrl = null;

        if (!empty($profile['photo_path']) || !empty($profile['logo_path'])) {
            $photoUrl = '/api/'.$request->user()->role.'/photo';
        }
        if (!empty($profile['cv_path'])) {
            $cvUrl = '/api/candidate/cv';
        }

        unset($profile['photo_path'], $profile['logo_path'], $profile['cv_path']);

        return response()->json([
            'user' => $request->user(),
            'profile' => $profile,
            'photo_url' => $photoUrl,
            'cv_url' => $cvUrl,
            'csrf_token' => $request->attributes->get('csrf_token'),
        ])->header('Cache-Control', 'no-store');
    }

    public function update(Request $request)
    {
        $rules = [
            'phone' => 'sometimes|nullable|string|max:30',
            'city' => 'sometimes|nullable|string|max:120',
        ];

        if ($request->user()->role === 'candidate') {
            $rules = array_merge($rules, AccountRules::names('sometimes'), [
                'summary' => 'sometimes|nullable|string|max:10000',
                'current_studies' => 'sometimes|nullable|string|max:200',
                'availability' => 'sometimes|nullable|string|max:2000',
                'linkedin' => 'sometimes|nullable|url:http,https|max:500',
                'github' => 'sometimes|nullable|url:http,https|max:500',
                'portfolio' => 'sometimes|nullable|url:http,https|max:500',
                'mobility' => 'sometimes|boolean',
                'preferred_modality' => ['sometimes', 'nullable', Rule::in(['onsite', 'hybrid', 'remote'])],
                'preferred_schedule' => ['sometimes', 'nullable', Rule::in(['full_time', 'part_time', 'flexible'])],
            ]);
        } else {
            $rules = array_merge($rules, [
                'company_name' => 'sometimes|required|string|max:200',
                'description' => 'sometimes|nullable|string|max:10000',
                'website' => 'sometimes|nullable|url:http,https|max:500',
                'contact_email' => 'sometimes|nullable|email:rfc|max:254',
                'address' => 'sometimes|nullable|string|max:255',
            ]);
        }

        $data = $request->validate($rules);

        DB::transaction(function () use ($request, $data) {
            $userData = [];
            foreach (['name', 'surname', 'second_surname'] as $field) {
                if (array_key_exists($field, $data)) {
                    $userData[$field] = $data[$field];
                    unset($data[$field]);
                }
            }

            if (array_key_exists('company_name', $data)) {
                $userData['name'] = $data['company_name'];
                $userData['surname'] = null;
                $userData['second_surname'] = null;
                $data['name'] = $data['company_name'];
                unset($data['company_name']);
            }

            if (!empty($userData)) {
                $request->user()->update($userData);
            }
            if (!empty($data)) {
                $this->profileQuery($request)->update($data);
            }
        });

        return $this->show($request);
    }

    public function uploadPhoto(Request $request)
    {
        $request->validate([
            'file' => [
                'required', 'file', 'image', 'mimetypes:image/jpeg,image/png,image/webp',
                'max:'.config('feisea.photo_max_kb'), 'dimensions:max_width=4096,max_height=4096',
            ],
        ]);

        $column = $this->photoColumn($request);
        $this->saveUpload($request, $column, 'photos');
        return $this->show($request);
    }

    public function photo(Request $request)
    {
        $column = $this->photoColumn($request);
        $path = $this->profile($request)->{$column};
        if (!$path || !Storage::exists($path)) {
            abort(404, 'No photo uploaded.');
        }

        return response()->file(Storage::path($path), [
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store',
        ]);
    }

    public function deletePhoto(Request $request)
    {
        $column = $this->photoColumn($request);
        $this->removeUpload($request, $column);
        return $this->show($request);
    }

    public function uploadCv(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimetypes:application/pdf', 'max:'.config('feisea.cv_max_kb')],
        ]);

        $file = $request->file('file');
        $this->saveUpload($request, 'cv_path', 'cvs', [
            'cv_original_name' => mb_substr(basename($file->getClientOriginalName()), 0, 255),
            'cv_mime_type' => 'application/pdf',
            'cv_size_bytes' => $file->getSize(),
        ]);

        return $this->show($request);
    }

    public function cv(Request $request)
    {
        $path = $this->profile($request)->cv_path;
        if (!$path || !Storage::exists($path)) {
            abort(404, 'No CV uploaded.');
        }

        return response()->download(Storage::path($path), 'cv.pdf', [
            'Content-Type' => 'application/pdf',
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store',
        ]);
    }

    public function deleteCv(Request $request)
    {
        $this->removeUpload($request, 'cv_path', [
            'cv_original_name' => null,
            'cv_mime_type' => null,
            'cv_size_bytes' => null,
        ]);

        return $this->show($request);
    }

    public function extractCv(Request $request)
    {
        $path = $this->profile($request)->cv_path;
        if (!$path || !Storage::exists($path)) {
            abort(404, 'Upload a CV first.');
        }

        try {
            $result = Process::timeout(12)->run([
                'python3', base_path('scripts/cv_extract.py'), Storage::path($path),
            ]);
        } catch (ProcessTimedOutException $exception) {
            abort(422, 'This PDF took too long to read. Try a simpler PDF.');
        }

        if (!$result->successful()) {
            abort(422, 'Cannot read this PDF. Try a PDF with selectable text.');
        }

        $suggestions = json_decode($result->output(), true, 512, JSON_THROW_ON_ERROR);
        return response()->json($suggestions);
    }

    private function profileQuery(Request $request)
    {
        $user = $request->user();
        if ($user->role === 'candidate') {
            return $user->candidateProfile();
        }

        return $user->company();
    }

    private function profile(Request $request)
    {
        $profile = $this->profileQuery($request)->first();
        if (!$profile) {
            abort(404, 'Profile not found.');
        }

        return $profile;
    }

    private function photoColumn(Request $request)
    {
        if ($request->user()->role === 'candidate') {
            return 'photo_path';
        }

        return 'logo_path';
    }

    private function saveUpload(Request $request, string $column, string $folder, array $metadata = [])
    {
        $newPath = $request->file('file')->store('uploads/'.$folder);

        try {
            $oldPath = DB::transaction(function () use ($request, $column, $newPath, $metadata) {
                $profile = $this->profileQuery($request)->lockForUpdate()->first();
                if (!$profile) {
                    abort(404, 'Profile not found.');
                }

                $oldPath = $profile->{$column};
                $metadata[$column] = $newPath;
                $profile->update($metadata);
                return $oldPath;
            });
        } catch (\Throwable $exception) {
            Storage::delete($newPath);
            throw $exception;
        }

        if ($oldPath) {
            Storage::delete($oldPath);
        }
    }

    private function removeUpload(Request $request, string $column, array $metadata = [])
    {
        $oldPath = DB::transaction(function () use ($request, $column, $metadata) {
            $profile = $this->profileQuery($request)->lockForUpdate()->first();
            if (!$profile) {
                abort(404, 'Profile not found.');
            }

            $oldPath = $profile->{$column};
            $metadata[$column] = null;
            $profile->update($metadata);
            return $oldPath;
        });

        if ($oldPath) {
            Storage::delete($oldPath);
        }
    }
}
