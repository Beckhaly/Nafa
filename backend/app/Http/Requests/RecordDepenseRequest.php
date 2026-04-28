<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RecordDepenseRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'categorie_id'    => 'required|integer|exists:categories_depenses,id',
            'event_id'        => 'nullable|integer|exists:events,id',
            'libelle'         => 'required|string|max:255',
            'montant'         => 'required|numeric|min:0.01',
            'date_depense'    => 'nullable|date',
            'beneficiaire'    => 'nullable|string|max:150',
            'reference_piece' => 'nullable|string|max:50',
        ];
    }
}
