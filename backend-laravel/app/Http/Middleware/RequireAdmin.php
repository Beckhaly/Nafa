<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RequireAdmin
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if (!$user || $user->load('role')->role?->code !== 'admin') {
            return response()->json(['message' => 'Accès réservé aux administrateurs.'], 403);
        }
        return $next($request);
    }
}
