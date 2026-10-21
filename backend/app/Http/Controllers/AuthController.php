<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Rules\AccountRules;
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

        $rules = [
            'email' => ['required', 'email:rfc', 'max:254', 'regex:/^[^\s@]+@[^\s@]+\.[^\s@]+$/u', Rule::unique('users')],
            'password' => array_merge(['required', 'confirmed'], AccountRules::password()),
        ];

        if ($role === 'candidate') {
            $rules = array_merge($rules, AccountRules::names());
            $rules['company_name'] = ['prohibited'];
        } else {
            $rules['company_name'] = ['required', 'string', 'max:200'];
        }

        $data = $request->validate($rules);

        DB::transaction(function () use ($data, $role, $verification) {
            if ($role === 'company') {
                $name = $data['company_name'];
            } else {
                $name = $data['name'];
            }

            $user = User::create([
                'name' => $name,
                'surname' => $data['surname'] ?? null,
                'second_surname' => $data['second_surname'] ?? null,
                'email' => $data['email'],
                'password_hash' => Hash::make($data['password']),
                'role' => $role,
                'status' => 'pending',
            ]);

            if ($role === 'candidate') {
                $user->candidateProfile()->create([]);
            } else {
                $user->company()->create([
                    'name' => $data['company_name'],
                    'contact_email' => $user->email,
                ]);
            }

            $verification->send($user);
        });

        return response()->json([
            'message' => 'Account created. Check your email to verify it before logging in.',
        ], 201);
    }

    public function verify(Request $request)
    {
        $data = $request->validate([
            'token' => ['required', 'string', 'regex:/^[a-f0-9]{64}$/'],
        ]);

        $role = DB::transaction(function () use ($data) {
            $tokenHash = hash('sha256', $data['token']);
            $token = DB::table('auth_tokens')
                ->where('purpose', 'email_verification')
                ->where('token_hash', $tokenHash)
                ->lockForUpdate()
                ->first();

            if (!$token || $token->used_at || now()->gte($token->expires_at)) {
                abort(422, 'This verification link is invalid or expired.');
            }

            $user = User::whereKey($token->user_id)->lockForUpdate()->firstOrFail();
            if ($user->status === 'blocked') {
                abort(403, 'Account is blocked.');
            }

            $user->email_verified_at = now();
            $user->status = 'active';
            $user->save();

            DB::table('auth_tokens')->where('id', $token->id)->update(['used_at' => now()]);
            return $user->role;
        });

        return response()->json([
            'message' => 'Email verified. You can now log in.',
            'role' => $role,
        ]);
    }

    public function resend(Request $request, string $role, Verification $verification)
    {
        $this->normalizeEmail($request);
        $data = $request->validate([
            'email' => ['required', 'email:rfc', 'max:254'],
        ]);

        DB::transaction(function () use ($data, $role, $verification) {
            $user = User::where('email', $data['email'])
                ->where('role', $role)
                ->lockForUpdate()
                ->first();

            if ($user && $user->status === 'pending' && !$user->email_verified_at) {
                $verification->send($user);
            }
        });

        return response()->json([
            'message' => 'If the account needs verification, a new email has been sent.',
        ], 202);
    }

    public function login(Request $request, string $role)
    {
        $this->normalizeEmail($request);
        $data = $request->validate([
            'email' => ['required', 'email:rfc', 'max:254'],
            'password' => ['required', 'string', 'max:1024'],
        ]);

        $user = User::where('email', $data['email'])->where('role', $role)->first();

        // Check a dummy hash too, so unknown emails still take time to verify.
        $passwordHash = '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.';
        if ($user) {
            $passwordHash = $user->password_hash;
        }

        $passwordMatches = Hash::check($data['password'], $passwordHash);
        if (!$user || !$passwordMatches) {
            abort(401, 'Email or password is incorrect.');
        }

        if ($user->status !== 'active' || !$user->email_verified_at) {
            abort(403, 'Verify your email before logging in, or contact support if your account is blocked.');
        }

        if ($role === 'company' && $user->company()->value('status') === 'blocked') {
            abort(403, 'Company account is blocked.');
        }

        $token = bin2hex(random_bytes(32));

        DB::transaction(function () use ($request, $user, $token) {
            DB::table('sessions')->where('expires_at', '<=', now())->delete();

            $oldToken = $request->cookie(config('feisea.cookie'));
            if (is_string($oldToken)) {
                DB::table('sessions')->where('token_hash', hash('sha256', $oldToken))->delete();
            }

            DB::table('sessions')->insert([
                'user_id' => $user->id,
                'token_hash' => hash('sha256', $token),
                'ip_address' => $request->ip(),
                'user_agent' => Str::limit($request->userAgent() ?? '', 500, ''),
                'expires_at' => now()->addMinutes(config('feisea.session_minutes')),
            ]);

            $user->last_login_at = now();
            $user->save();
        });

        $csrfToken = hash_hmac('sha256', $token, config('app.key'));
        $response = response()->json(['user' => $user, 'csrf_token' => $csrfToken]);

        return $response->cookie(
            config('feisea.cookie'), $token, config('feisea.session_minutes'),
            '/', null, $request->isSecure(), true, false, 'lax'
        );
    }

    public function logout(Request $request)
    {
        $sessionId = $request->attributes->get('session_id');
        DB::table('sessions')->where('id', $sessionId)->delete();

        return response()->json(['message' => 'Logged out.'])
            ->withoutCookie(config('feisea.cookie'));
    }

    private function normalizeEmail(Request $request)
    {
        $email = $request->input('email');
        if (is_string($email)) {
            $request->merge(['email' => Str::lower(trim($email))]);
        }
    }
}
