<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Requests\CreateAnnonceRequest;
use App\Http\Requests\PublierAnnonceRequest;
use App\Jobs\SendDiffusionJob;

class AnnonceController extends Controller
{
    public function index(Request $request)
    {
        $query = DB::table('annonces')
            ->join('types_annonce', 'types_annonce.id', '=', 'annonces.type_id')
            ->leftJoin('members', 'members.id', '=', 'annonces.member_id')
            ->select(
                'annonces.*',
                'types_annonce.libelle AS type',
                'types_annonce.couleur AS type_couleur',
                DB::raw("CONCAT(members.nom, ' ', members.prenom, IFNULL(CONCAT(' (', members.alias, ')'), '')) AS membre_concerne")
            );

        if ($request->filled('statut')) {
            $query->where('annonces.statut', $request->statut);
        }
        if ($request->filled('type_id')) {
            $query->where('annonces.type_id', $request->type_id);
        }

        return response()->json($query->orderByDesc('annonces.created_at')->get());
    }

    public function store(CreateAnnonceRequest $request)
    {
        $d = $request->validated();

        $id = DB::table('annonces')->insertGetId([
            'type_id'        => $d['type_id'],
            'member_id'      => $d['member_id']      ?? null,
            'titre'          => $d['titre'],
            'contenu'        => $d['contenu'],
            'date_evenement' => $d['date_evenement']  ?? null,
            'statut'         => 'brouillon',
            'created_by'     => $request->user()->id,
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        return response()->json(['id' => $id, 'message' => 'Annonce créée.'], 201);
    }

    public function show(int $id)
    {
        $annonce = DB::table('annonces')
            ->join('types_annonce', 'types_annonce.id', '=', 'annonces.type_id')
            ->leftJoin('members', 'members.id', '=', 'annonces.member_id')
            ->select(
                'annonces.*',
                'types_annonce.libelle AS type',
                'types_annonce.couleur AS type_couleur',
                DB::raw("CONCAT(members.nom, ' ', members.prenom, IFNULL(CONCAT(' (', members.alias, ')'), '')) AS membre_concerne")
            )
            ->where('annonces.id', $id)
            ->first();

        abort_unless($annonce, 404, 'Annonce introuvable');

        $annonce->stats = DB::table('v_diffusions_stats')
            ->where('annonce_id', $id)
            ->first();

        return response()->json($annonce);
    }

    public function update(CreateAnnonceRequest $request, int $id)
    {
        $annonce = DB::table('annonces')->where('id', $id)->first();
        abort_unless($annonce, 404, 'Annonce introuvable');

        if ($annonce->statut === 'archive') {
            return response()->json(['message' => 'Impossible de modifier une annonce archivée.'], 422);
        }

        DB::table('annonces')
            ->where('id', $id)
            ->update(array_merge($request->validated(), ['updated_at' => now()]));

        return response()->json(['message' => 'Annonce mise à jour.']);
    }

    public function publier(PublierAnnonceRequest $request, int $id)
    {
        $d = $request->validated();

        $memberIds = isset($d['member_ids']) ? json_encode($d['member_ids']) : null;

        DB::statement(
            'CALL sp_publier_annonce(?,?,?,?,@nb_sms,@nb_wa,@msg)',
            [$id, $d['canal'], $memberIds, $request->user()->id]
        );

        $out = DB::selectOne('SELECT @nb_sms AS nb_sms, @nb_wa AS nb_whatsapp, @msg AS message');

        if (str_starts_with($out->message ?? '', 'ERREUR')) {
            return response()->json(['message' => $out->message], 422);
        }

        // Dispatch du job de diffusion en arrière-plan
        SendDiffusionJob::dispatch($id);

        return response()->json([
            'nb_sms'      => (int) $out->nb_sms,
            'nb_whatsapp' => (int) $out->nb_whatsapp,
            'message'     => $out->message,
        ]);
    }

    public function diffusions(Request $request, int $id)
    {
        abort_unless(DB::table('annonces')->where('id', $id)->exists(), 404, 'Annonce introuvable');

        $query = DB::table('diffusions')
            ->join('members', 'members.id', '=', 'diffusions.member_id')
            ->select(
                'diffusions.*',
                DB::raw("CONCAT(members.nom, ' ', members.prenom, IFNULL(CONCAT(' (', members.alias, ')'), '')) AS nom_complet"),
                'members.matricule'
            )
            ->where('diffusions.annonce_id', $id);

        if ($request->filled('statut')) {
            $query->where('diffusions.statut', $request->statut);
        }
        if ($request->filled('canal')) {
            $query->where('diffusions.canal', $request->canal);
        }

        return response()->json($query->get());
    }

    public function types()
    {
        return response()->json(DB::table('types_annonce')->get());
    }
}
