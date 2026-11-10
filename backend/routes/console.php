<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

Artisan::command('app:migrate', function () {
    DB::transaction(function () {
        foreach (glob(database_path('migrations/*.sql')) as $migration) DB::unprepared(file_get_contents($migration));
    });
    $this->info('Database is up to date.');
});

Artisan::command('app:create-admin', function () {
    $email = strtolower(trim(env('ADMIN_EMAIL', '')));
    $password = env('ADMIN_PASSWORD', '');
    validator(['email' => $email, 'password' => $password], [
        'email' => 'required|email:rfc|max:254',
        'password' => array_merge(['required'], App\Rules\AccountRules::password()),
    ])->validate();
    DB::transaction(function () use ($email, $password) {
        $user = App\Models\User::where('email', $email)->first();
        if ($user) {
            if ($user->role !== 'admin') {
                throw new RuntimeException('This email belongs to another account.');
            }
            return;
        }
        $user = App\Models\User::create([
            'name' => 'Administrator', 'email' => $email,
            'password_hash' => Illuminate\Support\Facades\Hash::make($password),
            'role' => 'admin', 'status' => 'active',
        ]);
        $user->email_verified_at = now();
        $user->save();
    });
    $this->info('Administrator account is ready.');
});
