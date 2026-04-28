<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpsertMemberRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $memberId = $this->route('id');
        $emailUnique  = 'unique:members,email'  . ($memberId ? ",{$memberId}" : '');
        $phoneUnique  = 'unique:members,telephone' . ($memberId ? ",{$memberId}" : '');

        return [
            'nom'               => 'required|string|max:100',
            'prenom'            => 'required|string|max:100',
            'alias'             => 'nullable|string|max:100',
            'telephone'         => "required|string|max:20|{$phoneUnique}",
            'telephone2'        => 'nullable|string|max:20',
            'email'             => "nullable|email|max:150|{$emailUnique}",
            'date_adhesion'     => 'nullable|date',
            'role_id'           => 'nullable|integer|exists:roles_membres,id',
            'statut'            => 'nullable|in:actif,inactif,suspendu',
            'lieu_habitation'   => 'nullable|string|max:255',
            'emploi'            => 'nullable|string|max:100',
            'commentaires'      => 'nullable|string',
        ];
    }
}
