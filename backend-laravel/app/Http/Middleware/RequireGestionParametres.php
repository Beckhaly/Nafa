<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RequireGestionParametres
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        $code = $user?->load('role')->role?->code;
        if (! in_array($code, ['admin', 'super_utilisateur'], true)) {
            return response()->json(['message' => 'Accès réservé aux administrateurs et super utilisateurs.'], 403);
        }
        return $next($request);
    }
}
