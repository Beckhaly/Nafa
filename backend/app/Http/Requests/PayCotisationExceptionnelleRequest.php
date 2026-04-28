<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PayCotisationExceptionnelleRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'montant' => 'required|numeric|min:0.01',
        ];
    }
}
