<?php

namespace App\Http\Controllers;

use App\Models\JobOffer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class AdminOfferController
{
    public function index(Request $request)
    {
        $data = $request->validate(['search' => 'nullable|string|max:200']);
        $offers = JobOffer::with('company:id,name')->withCount('applications');
        if (!empty($data['search'])) {
            $offers->where('title', 'ilike', '%'.$data['search'].'%');
        }
        return $offers->orderByDesc('id')->paginate(20);
    }

    public function close(string $offer)
    {
        $offer = DB::transaction(function () use ($offer) {
            $offer = JobOffer::whereKey($offer)->lockForUpdate()->firstOrFail();
            $offer->status = 'closed';
            $offer->closed_at = now();
            $offer->save();
            return $offer;
        });
        return $offer;
    }

    public function destroy(string $offer)
    {
        $paths = DB::transaction(function () use ($offer) {
            $offer = JobOffer::whereKey($offer)->lockForUpdate()->firstOrFail();
            $paths = $offer->applications()->pluck('cv_snapshot_path')->all();
            DB::table('notifications')->where('job_offer_id', $offer->id)->delete();
            $offer->delete();
            return $paths;
        });
        Storage::delete($paths);
        return response()->json(['message' => 'Offer deleted.']);
    }
}
