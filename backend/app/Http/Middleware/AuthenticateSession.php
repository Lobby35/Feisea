<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuthenticateSession
{
    public function handle(Request $request, Closure $next, ?string $role = null)
    {
        $token = $request->cookie(config('feisea.cookie'), '');
        if (!is_string($token) || !preg_match('/^[a-f0-9]{64}$/', $token)) {
            abort(401, 'Please log in.');
        }

        $session = DB::table('sessions')
            ->where('token_hash', hash('sha256', $token))
            ->where('expires_at', '>', now())
            ->first();

        if (!$session) {
            abort(401, 'Your session has expired.');
        }

        $user = User::find($session->user_id);
        if (!$user || $user->status !== 'active' || !$user->email_verified_at) {
            abort(401, 'Account is unavailable.');
        }
        if ($role && $user->role !== $role) {
            abort(403, 'This page belongs to another account type.');
        }
        if ($user->role === 'company' && $user->company()->value('status') === 'blocked') {
            abort(403, 'Company account is blocked.');
        }

        $csrfToken = hash_hmac('sha256', $token, config('app.key'));
        if (!in_array($request->method(), ['GET', 'HEAD'])) {
            $submittedToken = $request->header('X-CSRF-Token', '');
            if (!hash_equals($csrfToken, $submittedToken)) {
                abort(419, 'Please refresh the page and try again.');
            }
        }

        $request->setUserResolver(function () use ($user) {
            return $user;
        });
        $request->attributes->set('session_id', $session->id);
        $request->attributes->set('csrf_token', $csrfToken);

        DB::table('sessions')->where('id', $session->id)->update(['last_seen_at' => now()]);
        return $next($request);
    }
}
