<?php

namespace App\Http\Controllers;

use App\Http\Requests\UserRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;

class UserController
{
    public function index(Request $request): JsonResponse
    {
        $parameters = $request->validate([
            'page' => ['sometimes', 'integer', 'min:1', 'max:1000000'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        return response()->json(User::orderBy('id')->paginate($parameters['per_page'] ?? 20));
    }

    public function store(UserRequest $request): JsonResponse
    {
        $user = User::create($this->attributes($request))->refresh();

        return response()->json($user, 201);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json($user);
    }

    public function update(UserRequest $request, User $user): JsonResponse
    {
        $user->fill($this->attributes($request))->save();

        return response()->json($user->refresh());
    }

    public function destroy(User $user): Response
    {
        $user->delete();

        return response()->noContent();
    }

    private function attributes(UserRequest $request): array
    {
        $attributes = $request->validated();
        if (array_key_exists('password', $attributes)) {
            $attributes['password_hash'] = Hash::make($attributes['password']);
            unset($attributes['password']);
        }

        return $attributes;
    }
}
