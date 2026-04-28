<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RecordDonRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'member_id'    => 'nullable|integer|exists:members,id',
            'event_id'     => 'nullable|integer|exists:events,id',
            'donateur_nom' => 'nullable|string|max:150',
            'montant'      => 'required|numeric|min:0.01',
            'date_don'     => 'nullable|date',
            'motif'        => 'nullable|string|max:255',
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($v) {
            if (! $this->member_id && ! $this->donateur_nom) {
                $v->errors()->add('donateur_nom', 'Requis si le donateur n\'est pas un membre.');
            }
        });
    }
}
