<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PayContributionRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'member_id'  => 'required|integer|exists:members,id',
            'annee'      => 'required|integer|min:2000|max:2100',
            'mois'       => 'required|integer|min:1|max:12',
            'montant'    => 'required|numeric|min:0.01',
            'montant_du' => 'required|numeric|min:0.01',
        ];
    }
}
