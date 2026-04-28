<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateEventRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'type_id'     => 'required|integer|exists:types_evenement,id',
            'titre'       => 'required|string|max:200',
            'description' => 'nullable|string',
            'date_debut'  => 'required|date',
            'date_fin'    => 'nullable|date|after_or_equal:date_debut',
            'lieu'        => 'nullable|string|max:200',
            'statut'      => 'nullable|in:planifie,en_cours,termine,annule',
        ];
    }
}
