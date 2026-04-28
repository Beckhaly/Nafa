<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ParametreController extends Controller
{
    public function index()
    {
        $p = DB::table('parametres')->where('id', 1)->first();

        if (! $p) {
            // Auto-create singleton row if missing
            DB::table('parametres')->insert(['id' => 1]);
            $p = DB::table('parametres')->where('id', 1)->first();
        }

        return response()->json($p);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'nom_association'             => 'required|string|max:200',
            'slogan'                      => 'nullable|string|max:300',
            'adresse'                     => 'nullable|string|max:500',
            'telephone'                   => 'nullable|string|max:30',
            'email_contact'               => 'nullable|email|max:150',
            'montant_cotisation_mensuelle'=> 'required|numeric|min:0',
            'devise'                      => 'required|string|max:10',
            'exercice_courant'            => 'required|integer|min:2020|max:2100',
            'logo_url'                    => 'nullable|string|max:255',
        ]);

        DB::table('parametres')->updateOrInsert(['id' => 1], $data);

        return response()->json(DB::table('parametres')->where('id', 1)->first());
    }
}
