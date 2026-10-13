<?php

return [
    'name' => env('APP_NAME'),
    'env' => env('APP_ENV'),
    'debug' => (bool) env('APP_DEBUG', false),
    'url' => env('APP_URL'),
    'timezone' => env('TZ', 'UTC'),
    'locale' => env('APP_LOCALE', 'ca'),
    'fallback_locale' => env('APP_FALLBACK_LOCALE', 'en'),
    'key' => env('APP_KEY'),
    'cipher' => 'AES-256-CBC',
];
