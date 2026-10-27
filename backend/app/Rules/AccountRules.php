<?php

namespace App\Rules;

use Illuminate\Validation\Rules\Password;

class AccountRules
{
    public static function names(string $presence = 'required'): array
    {
        return [
            'name' => [$presence, 'required', 'string', 'max:150'],
            'surname' => [$presence, 'required', 'string', 'max:150'],
            'second_surname' => ['sometimes', 'nullable', 'string', 'max:150'],
        ];
    }

    public static function password(): array
    {
        return ['string', Password::min(12)->mixedCase()->numbers()->symbols(), 'max:72', function ($attribute, $value, $fail) {
            if (is_string($value) && strlen($value) > 72) {
                $fail('Password is too long.');
            }
        }];
    }
}
