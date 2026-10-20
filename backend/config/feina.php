<?php

return [
    'cookie' => env('AUTH_COOKIE', 'feina_session'),
    'session_minutes' => (int) env('AUTH_SESSION_MINUTES', 720),
    'verification_minutes' => (int) env('AUTH_VERIFICATION_MINUTES', 60),
    'origins' => array_filter(explode(',', env('APP_ALLOWED_ORIGINS', ''))),
    'photo_max_kb' => (int) env('PHOTO_MAX_KB', 2048),
    'cv_max_kb' => (int) env('CV_MAX_KB', 10240),
];
