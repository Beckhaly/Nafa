<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ParametreController extends Controller
{
    public function index()
    {
        $p = DB::table('parametres')->where('id', 1)->first();

        if (! $p) {
            DB::table('parametres')->insert(['id' => 1]);
            $p = DB::table('parametres')->where('id', 1)->first();
        }

        return response()->json($p);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'nom_association'              => 'required|string|max:200',
            'slogan'                       => 'nullable|string|max:300',
            'adresse'                      => 'nullable|string|max:500',
            'telephone'                    => 'nullable|string|max:30',
            'email_contact'                => 'nullable|email|max:150',
            'site_web'                     => 'nullable|string|max:255',
            'whatsapp_groupe'              => 'nullable|string|max:255',
            'date_creation'                => 'nullable|date',
            'numero_enregistrement'        => 'nullable|string|max:100',
            'montant_cotisation_mensuelle' => 'required|numeric|min:0',
            'montant_adhesion'             => 'nullable|numeric|min:0',
            'devise'                       => 'required|string|max:10',
            'plafond_pret'                 => 'nullable|numeric|min:0',
            'taux_interet_pret'            => 'nullable|numeric|min:0|max:100',
            'exercice_courant'             => 'required|integer|min:2020|max:2100',
            'logo_url'                     => 'nullable|string|max:255',
            'reglement_interieur'          => 'nullable|string',
            'reglement_url'                => 'nullable|string|max:255',
            'enable_sms'                   => 'nullable|boolean',
            'enable_whatsapp'              => 'nullable|boolean',
            'enable_whatsapp_share'        => 'nullable|boolean',
        ]);

        DB::table('parametres')->updateOrInsert(['id' => 1], $data);

        return response()->json(DB::table('parametres')->where('id', 1)->first());
    }

    public function uploadLogo(Request $request)
    {
        $request->validate([
            'logo' => 'required|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
        ]);

        // Supprimer l'ancien logo s'il est dans notre storage
        $current = DB::table('parametres')->where('id', 1)->value('logo_url');
        if ($current && str_starts_with($current, '/storage/logos/')) {
            Storage::disk('public')->delete('logos/' . basename($current));
        }

        $path = $request->file('logo')->store('logos', 'public');
        $url  = '/storage/' . $path;

        DB::table('parametres')->updateOrInsert(['id' => 1], ['logo_url' => $url]);

        return response()->json(['logo_url' => $url]);
    }

    public function uploadReglement(Request $request)
    {
        $request->validate([
            'reglement' => 'required|file|mimes:pdf|max:10240',
        ]);

        $current = DB::table('parametres')->where('id', 1)->value('reglement_url');
        if ($current && str_starts_with($current, '/storage/reglements/')) {
            Storage::disk('public')->delete('reglements/' . basename($current));
        }

        $path = $request->file('reglement')->store('reglements', 'public');
        $url  = '/storage/' . $path;

        DB::table('parametres')->updateOrInsert(['id' => 1], ['reglement_url' => $url]);

        return response()->json(['reglement_url' => $url]);
    }
}
