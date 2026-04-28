<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RoleUtilisateur extends Model
{
    protected $table      = 'roles_utilisateurs';
    protected $fillable   = ['code', 'libelle', 'description'];
    public    $timestamps = false;
}
