<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\Verification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AuthController
{
    public function register(Request $request, string $role, Verification $verification)
    {
        $this->normalizeEmail($request);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email:rfc', 'max:254', 'regex:/^[^\s@]+@[^\s@]+\.[^\s@]+$/u', Rule::unique('users')],
            'password' => ['required', 'string', 'min:8', 'max:72', 'confirmed', function ($attribute, $value, $fail) {
                if (is_string($value) && strlen($value) > 72) $fail('Password must not exceed 72 bytes.');
            }],
            'company_name' => [$role === 'company' ? 'required' : 'prohibited', 'string', 'max:200'],
        ]);
        DB::transaction(function () use ($data, $role, $verification) {
            $user = User::create([
                'name' => $data['name'], 'email' => $data['email'], 'password_hash' => Hash::make($data['password']),
                'role' => $role, 'status' => 'pending',
            ]);
            if ($role === 'candidate') {
                DB::table('candidate_profiles')->insert(['user_id' => $user->id]);
            } else {
                DB::table('companies')->insert(['user_id' => $user->id, 'name' => $data['company_name'], 'contact_email' => $user->email]);
            }
            $verification->send($user);
        });

        return response()->json(['message' => 'Account created. Check your email to verify it before logging in.'], 201);
    }

    public function verify(Request $request)
    {
        $data = $request->validate(['token' => ['required', 'string', 'regex:/^[a-f0-9]{64}$/']]);
        $role = DB::transaction(function () use ($data) {
            $token = DB::table('auth_tokens')->where('purpose', 'email_verification')
                ->where('token_hash', hash('sha256', $data['token']))->lockForUpdate()->first();
            abort_unless($token && !$token->used_at && now()->lt($token->expires_at), 422, 'This verification link is invalid or expired.');
            $user = User::whereKey($token->user_id)->lockForUpdate()->firstOrFail();
            abort_if($user->status === 'blocked', 403, 'Account is blocked.');
            $user->forceFill(['email_verified_at' => now(), 'status' => 'active'])->save();
            DB::table('auth_tokens')->where('id', $token->id)->update(['used_at' => now()]);
            return $user->role;
        });

        return response()->json(['message' => 'Email verified. You can now log in.', 'role' => $role]);
    }

    public function resend(Request $request, string $role, Verification $verification)
    {
        $this->normalizeEmail($request);
        $data = $request->validate(['email' => ['required', 'email:rfc', 'max:254']]);
        DB::transaction(function () use ($data, $role, $verification) {
            $user = User::where('email', $data['email'])->where('role', $role)->lockForUpdate()->first();
            if ($user && $user->status === 'pending' && !$user->email_verified_at) $verification->send($user);
        });
        return response()->json(['message' => 'If the account needs verification, a new email has been sent.'], 202);
    }

    public function login(Request $request, string $role)
    {
        $this->normalizeEmail($request);
        $data = $request->validate(['email' => ['required', 'email:rfc', 'max:254'], 'password' => ['required', 'string', 'max:1024']]);
        $user = User::where('email', $data['email'])->where('role', $role)->first();
        $hash = $user?->password_hash ?? '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.';
        $valid = Hash::check($data['password'], $hash);
        abort_unless($user && $valid, 401, 'Email or password is incorrect.');
        abort_unless($user->status === 'active' && $user->email_verified_at, 403, 'Verify your email before logging in, or contact support if your account is blocked.');
        abort_if($role === 'company' && DB::table('companies')->where('user_id', $user->id)->value('status') === 'blocked', 403, 'Company account is blocked.');
        $token = bin2hex(random_bytes(32));
        DB::transaction(function () use ($request, $user, $token) {
            DB::table('sessions')->where('expires_at', '<=', now())->delete();
            $old = $request->cookie(config('feisea.cookie'));
            if (is_string($old)) DB::table('sessions')->where('token_hash', hash('sha256', $old))->delete();
            DB::table('sessions')->insert([
                'user_id' => $user->id, 'token_hash' => hash('sha256', $token), 'ip_address' => $request->ip(),
                'user_agent' => Str::limit($request->userAgent() ?? '', 500, ''),
                'expires_at' => now()->addMinutes(config('feisea.session_minutes')),
            ]);
            $user->forceFill(['last_login_at' => now()])->save();
        });

        return response()->json(['user' => $user, 'csrf_token' => hash_hmac('sha256', $token, config('app.key'))])
            ->cookie(config('feisea.cookie'), $token, config('feisea.session_minutes'), '/', null, $request->isSecure(), true, false, 'lax');
    }

    public function logout(Request $request)
    {
        DB::table('sessions')->where('id', $request->attributes->get('session_id'))->delete();
        return response()->json(['message' => 'Logged out.'])->withoutCookie(config('feisea.cookie'));
    }

    private function normalizeEmail(Request $request): void
    {
        if (is_string($request->input('email'))) $request->merge(['email' => Str::lower(trim($request->input('email')))]);
    }
}
