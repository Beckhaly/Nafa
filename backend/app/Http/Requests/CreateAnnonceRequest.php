<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateAnnonceRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'type_id'        => 'required|integer|exists:types_annonce,id',
            'member_id'      => 'nullable|integer|exists:members,id',
            'titre'          => 'required|string|max:200',
            'contenu'        => 'required|string|max:1600',
            'date_evenement' => 'nullable|date',
        ];
    }
}
