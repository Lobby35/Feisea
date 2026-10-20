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
        $token = $request->cookie(config('feina.cookie'), '');
        abort_unless(is_string($token) && preg_match('/^[a-f0-9]{64}$/', $token), 401, 'Please log in.');
        $session = DB::table('sessions')->where('token_hash', hash('sha256', $token))->where('expires_at', '>', now())->first();
        abort_unless($session, 401, 'Your session has expired.');
        $user = User::find($session->user_id);
        abort_unless($user && $user->status === 'active' && $user->email_verified_at, 401, 'Account is unavailable.');
        abort_if($role && $user->role !== $role, 403, 'This page belongs to another account type.');
        abort_if($user->role === 'company' && DB::table('companies')->where('user_id', $user->id)->value('status') === 'blocked', 403, 'Company account is blocked.');
        $csrf = hash_hmac('sha256', $token, config('app.key'));
        if (!in_array($request->method(), ['GET', 'HEAD'])) {
            abort_unless(hash_equals($csrf, $request->header('X-CSRF-Token', '')), 419, 'Please refresh the page and try again.');
        }
        $request->setUserResolver(fn () => $user);
        $request->attributes->set('session_id', $session->id);
        $request->attributes->set('csrf_token', $csrf);
        DB::table('sessions')->where('id', $session->id)->update(['last_seen_at' => now()]);

        return $next($request);
    }
}
