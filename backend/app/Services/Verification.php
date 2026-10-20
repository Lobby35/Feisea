<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;

class Verification
{
    public function send(User $user): void
    {
        $token = bin2hex(random_bytes(32));
        DB::table('auth_tokens')->updateOrInsert(
            ['user_id' => $user->id, 'purpose' => 'email_verification'],
            ['token_hash' => hash('sha256', $token), 'expires_at' => now()->addMinutes(config('feisea.verification_minutes')), 'used_at' => null],
        );
        $link = rtrim(config('app.url'), '/').'/verify-email#token='.$token;
        $text = "Hello {$user->name},\n\nConfirm your Feisea account by opening this link:\n{$link}\n\nThis link expires in ".config('feisea.verification_minutes')." minutes and can only be used once.\n\nIf you did not register, ignore this email.";
        try {
            Mail::raw($text, fn ($message) => $message->to($user->email)->subject('Verify your Feisea account'));
        } catch (TransportExceptionInterface) {
            abort(503, 'We could not send the verification email. Please try again later.');
        }
    }
}
