<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateCotisationExceptionnelleRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'member_id'     => 'nullable|integer|exists:members,id',
            'event_id'      => 'nullable|integer|exists:events,id',
            'annonce_id'    => 'nullable|integer|exists:annonces,id',
            'libelle'       => 'required|string|max:255',
            'montant_du'    => 'required|numeric|min:0.01',
            'date_echeance' => 'nullable|date',
        ];
    }
}
