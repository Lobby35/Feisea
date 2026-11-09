<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;

class OptionsController
{
    public function index()
    {
        $towns = json_decode(file_get_contents(resource_path('data/municipalities.json')), true);
        return response()->json([
            'municipalities' => $towns['municipalities'],
            'municipalities_source' => $towns['source'],
            'studies' => config('studies'),
            'skills' => DB::table('skills')->where('active', true)->orderBy('name')->get(['id', 'name']),
            'categories' => DB::table('categories')->where('active', true)->orderBy('name')->get(['id', 'name']),
            'qualifications' => DB::table('qualifications')->where('active', true)->get(['id', 'name']),
            'languages' => DB::table('languages')->where('active', true)->get(['id', 'name']),
        ]);
    }
}
