<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable, HasFactory;

    protected $fillable = ['name', 'email', 'password', 'role_id', 'member_id', 'is_active'];

    protected $hidden = ['password'];

    protected $casts = ['is_active' => 'boolean'];

    public function role()
    {
        return $this->belongsTo(RoleUtilisateur::class, 'role_id');
    }
}
