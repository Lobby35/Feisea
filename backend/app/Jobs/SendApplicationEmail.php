<?php

namespace App\Jobs;

use App\Models\Application;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Mail;

class SendApplicationEmail implements ShouldQueue
{
    use Queueable;

    public function __construct(public int $applicationId)
    {
    }

    public function handle(): void
    {
        $application = Application::with(['offer.company.user', 'candidate.user'])->find($this->applicationId);
        if (!$application) {
            return;
        }
        $companyUser = $application->offer->company->user;
        if ($application->offer->company->status !== 'approved' || !$companyUser || $companyUser->status !== 'active' || !$companyUser->email_verified_at) {
            return;
        }
        $candidate = $application->candidate->user;
        $title = $application->offer->title;
        $link = rtrim(config('app.url'), '/').'/company/offers/'.$application->job_offer_id.'/applications';
        $text = "{$candidate->name} {$candidate->surname} applied for {$title}.\n\nView the application:\n{$link}";
        Mail::raw($text, function ($message) use ($companyUser) {
            $message->to($companyUser->email)->subject('New application on Feisea');
        });
    }
}
