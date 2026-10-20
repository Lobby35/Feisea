<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

Artisan::command('app:migrate', function () {
    DB::transaction(function () {
        foreach (glob(database_path('migrations/*.sql')) as $migration) DB::unprepared(file_get_contents($migration));
    });
    $this->info('Database is up to date.');
});
