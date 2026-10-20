<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

Artisan::command('app:migrate', function () {
    DB::unprepared(file_get_contents(database_path('migrations/001_candidate_photo.sql')));
    $this->info('Database is up to date.');
});
