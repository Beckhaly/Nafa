<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateLoanRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'member_id'    => 'required|integer|exists:members,id',
            'montant'      => 'required|numeric|min:0.01',
            'taux_interet' => 'required|numeric|min:0|max:100',
            'duree_mois'   => 'required|integer|min:1|max:120',
            'date_debut'   => 'nullable|date',
        ];
    }
}
