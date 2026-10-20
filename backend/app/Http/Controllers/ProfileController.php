<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\Process\Process;

class ProfileController
{
    public function show(Request $request)
    {
        $profile = $this->profile($request);
        $hasPhoto = !empty($profile->photo_path ?? $profile->logo_path ?? null);
        $hasCv = !empty($profile->cv_path ?? null);
        unset($profile->photo_path, $profile->logo_path, $profile->cv_path);
        return response()->json([
            'user' => $request->user(), 'profile' => $profile,
            'photo_url' => $hasPhoto ? '/api/'.$request->user()->role.'/photo' : null,
            'cv_url' => $hasCv ? '/api/candidate/cv' : null,
            'csrf_token' => $request->attributes->get('csrf_token'),
        ])->header('Cache-Control', 'no-store');
    }

    public function update(Request $request)
    {
        $common = ['phone' => ['sometimes', 'nullable', 'string', 'max:30'], 'city' => ['sometimes', 'nullable', 'string', 'max:120']];
        $candidate = [
            'summary' => ['sometimes', 'nullable', 'string', 'max:10000'],
            'current_studies' => ['sometimes', 'nullable', 'string', 'max:200'],
            'availability' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'linkedin' => ['sometimes', 'nullable', 'url:http,https', 'max:500'],
            'github' => ['sometimes', 'nullable', 'url:http,https', 'max:500'],
            'portfolio' => ['sometimes', 'nullable', 'url:http,https', 'max:500'],
            'mobility' => ['sometimes', 'boolean'],
            'preferred_modality' => ['sometimes', 'nullable', Rule::in(['onsite', 'hybrid', 'remote'])],
            'preferred_schedule' => ['sometimes', 'nullable', Rule::in(['full_time', 'part_time', 'flexible'])],
        ];
        $company = [
            'company_name' => ['sometimes', 'required', 'string', 'max:200'],
            'description' => ['sometimes', 'nullable', 'string', 'max:10000'],
            'website' => ['sometimes', 'nullable', 'url:http,https', 'max:500'],
            'contact_email' => ['sometimes', 'nullable', 'email:rfc', 'max:254'],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
        $data = $request->validate(['name' => ['sometimes', 'required', 'string', 'max:150']] + $common + ($request->user()->role === 'candidate' ? $candidate : $company));
        DB::transaction(function () use ($request, $data) {
            if (array_key_exists('name', $data)) {
                $request->user()->update(['name' => $data['name']]);
                unset($data['name']);
            }
            if (array_key_exists('company_name', $data)) {
                $data['name'] = $data['company_name'];
                unset($data['company_name']);
            }
            if ($data) $this->query($request)->update($data);
        });
        return $this->show($request);
    }

    public function uploadPhoto(Request $request)
    {
        $request->validate(['file' => ['required', 'file', 'image', 'mimetypes:image/jpeg,image/png,image/webp', 'max:'.config('feina.photo_max_kb'), 'dimensions:max_width=4096,max_height=4096']]);
        $this->replace($request, $request->user()->role === 'candidate' ? 'photo_path' : 'logo_path', 'photos');
        return $this->show($request);
    }

    public function photo(Request $request)
    {
        $profile = $this->profile($request);
        $path = $profile->photo_path ?? $profile->logo_path ?? null;
        abort_unless($path && Storage::exists($path), 404, 'No photo uploaded.');
        return response()->file(Storage::path($path), ['X-Content-Type-Options' => 'nosniff', 'Cache-Control' => 'private, no-store']);
    }

    public function deletePhoto(Request $request)
    {
        $this->clear($request, $request->user()->role === 'candidate' ? 'photo_path' : 'logo_path');
        return $this->show($request);
    }

    public function uploadCv(Request $request)
    {
        $request->validate(['file' => ['required', 'file', 'mimetypes:application/pdf', 'max:'.config('feina.cv_max_kb')]]);
        $this->replace($request, 'cv_path', 'cvs', [
            'cv_original_name' => mb_substr(basename($request->file('file')->getClientOriginalName()), 0, 255),
            'cv_mime_type' => 'application/pdf', 'cv_size_bytes' => $request->file('file')->getSize(),
        ]);
        return $this->show($request);
    }

    public function cv(Request $request)
    {
        $path = $this->profile($request)->cv_path;
        abort_unless($path && Storage::exists($path), 404, 'No CV uploaded.');
        return response()->download(Storage::path($path), 'cv.pdf', ['Content-Type' => 'application/pdf', 'X-Content-Type-Options' => 'nosniff', 'Cache-Control' => 'private, no-store']);
    }

    public function deleteCv(Request $request)
    {
        $this->clear($request, 'cv_path', ['cv_original_name' => null, 'cv_mime_type' => null, 'cv_size_bytes' => null]);
        return $this->show($request);
    }

    public function extractCv(Request $request)
    {
        $path = $this->profile($request)->cv_path;
        abort_unless($path && Storage::exists($path), 404, 'Upload a CV first.');
        $process = new Process(['python3', base_path('scripts/cv_extract.py'), Storage::path($path)]);
        $process->setTimeout(12);
        try {
            $process->run();
        } catch (\Symfony\Component\Process\Exception\ProcessTimedOutException) {
            abort(422, 'This PDF took too long to read. Try a simpler PDF.');
        }
        abort_unless($process->isSuccessful(), 422, 'Cannot extract readable text from this PDF. Scanned documents need OCR.');
        return response()->json(json_decode($process->getOutput(), true, 512, JSON_THROW_ON_ERROR));
    }

    private function query(Request $request)
    {
        return DB::table($request->user()->role === 'candidate' ? 'candidate_profiles' : 'companies')->where('user_id', $request->user()->id);
    }

    private function profile(Request $request)
    {
        $profile = $this->query($request)->first();
        abort_unless($profile, 404, 'Profile not found.');
        return $profile;
    }

    private function replace(Request $request, string $field, string $folder, array $metadata = []): void
    {
        $path = $request->file('file')->store('uploads/'.$folder);
        try {
            $old = DB::transaction(function () use ($request, $field, $path, $metadata) {
                $profile = $this->query($request)->lockForUpdate()->first();
                abort_unless($profile, 404);
                $this->query($request)->update([$field => $path] + $metadata);
                return $profile->{$field};
            });
        } catch (\Throwable $error) {
            Storage::delete($path);
            throw $error;
        }
        if ($old) Storage::delete($old);
    }

    private function clear(Request $request, string $field, array $metadata = []): void
    {
        $old = DB::transaction(function () use ($request, $field, $metadata) {
            $profile = $this->query($request)->lockForUpdate()->first();
            abort_unless($profile, 404);
            $this->query($request)->update([$field => null] + $metadata);
            return $profile->{$field};
        });
        if ($old) Storage::delete($old);
    }
}
