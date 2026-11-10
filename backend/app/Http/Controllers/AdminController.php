<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Company;
use App\Models\JobOffer;
use App\Models\Application;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController
{
    public function summary(Request $request)
    {
        $notifications = DB::table('notifications')->where('user_id', $request->user()->id)
            ->where('type', 'company_registration')->whereNull('read_at')->orderByDesc('id')->limit(20)->get();
        foreach ($notifications as $notification) {
            $notification->data = json_decode($notification->data, true);
        }
        return response()->json([
            'users' => User::count(), 'companies' => Company::count(),
            'pending_companies' => Company::where('status', 'pending')->count(),
            'offers' => JobOffer::count(), 'applications' => Application::count(),
            'notifications' => $notifications,
        ])->header('Cache-Control', 'no-store');
    }
}
