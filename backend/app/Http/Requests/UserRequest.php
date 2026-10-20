<?php

namespace App\Http\Requests;

use App\Rules\AccountRules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('email'))) {
            $this->merge(['email' => Str::lower(trim($this->input('email')))]);
        }
    }

    public function rules(): array
    {
        $required = $this->isMethod('patch') ? 'sometimes' : 'required';
        $options = $this->isMethod('put') ? 'required' : 'sometimes';

        return AccountRules::names($required) + [
            'email' => [$required, 'required', 'email:rfc', 'max:254', 'regex:/^[^\s@]+@[^\s@]+\.[^\s@]+$/u'],
            'password' => array_merge([$this->isMethod('post') ? 'required' : 'sometimes', 'required'], AccountRules::password()),
            'role' => [$options, 'required', Rule::in(['candidate', 'company', 'admin'])],
            'status' => [$options, 'required', Rule::in(['pending', 'active', 'blocked'])],
            'preferred_locale' => [$options, 'required', Rule::in(['ca', 'es', 'en'])],
        ];
    }

    public function after(): array
    {
        return [function ($validator): void {
            if ($this->isMethod('patch') && !array_intersect(
                array_keys($this->all()), array_keys($this->rules())
            )) {
                $validator->errors()->add('user', 'Provide at least one editable field.');
            }
            if (is_string($this->input('password')) && strlen($this->input('password')) > 72) {
                $validator->errors()->add('password', 'The password must not exceed 72 bytes.');
            }
        }];
    }
}
