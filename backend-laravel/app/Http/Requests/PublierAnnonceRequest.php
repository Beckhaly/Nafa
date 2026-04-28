<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PublierAnnonceRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'canal'        => 'required|in:sms,whatsapp,both',
            'member_ids'   => 'nullable|array',
            'member_ids.*' => 'integer|exists:members,id',
        ];
    }
}
