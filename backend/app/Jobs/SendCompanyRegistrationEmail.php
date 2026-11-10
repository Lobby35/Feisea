<?php

namespace App\Jobs;

use App\Models\Company;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Mail;

class SendCompanyRegistrationEmail implements ShouldQueue
{
    use Queueable;

    public function __construct(public int $companyId, public int $adminId)
    {
    }

    public function handle(): void
    {
        $company = Company::with('user')->find($this->companyId);
        $admin = User::where('role', 'admin')->where('status', 'active')->whereNotNull('email_verified_at')->find($this->adminId);
        if (!$company || !$admin) {
            return;
        }
        $link = rtrim(config('app.url'), '/').'/admin/companies/'.$company->id;
        $text = "A company registered on Feisea.\n\nCompany: {$company->name}\nEmail: {$company->user->email}\n\nReview the registration:\n{$link}";
        Mail::raw($text, function ($message) use ($admin) {
            $message->to($admin->email)->subject('Company registration on Feisea');
        });
    }
}
