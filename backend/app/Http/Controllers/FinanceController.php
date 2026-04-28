<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Requests\PayContributionRequest;
use App\Http\Requests\CreateCotisationExceptionnelleRequest;
use App\Http\Requests\PayCotisationExceptionnelleRequest;
use App\Http\Requests\RecordDonRequest;
use App\Http\Requests\RecordDepenseRequest;

class FinanceController extends Controller
{
    // =========================================================================
    // Cotisations mensuelles
    // =========================================================================

    public function payContribution(PayContributionRequest $request)
    {
        $d = $request->validated();

        DB::statement(
            'CALL sp_pay_contribution(?,?,?,?,?,?,@recu,@statut,@msg)',
            [
                $d['member_id'],
                $d['annee'],
                $d['mois'],
                $d['montant'],
                $d['montant_du'],
                $request->user()->id,
            ]
        );

        $out = DB::selectOne('SELECT @recu AS recu, @statut AS statut, @msg AS message');

        if (! $out->recu) {
            return response()->json(['message' => $out->message], 422);
        }

        return response()->json([
            'reference_recu' => $out->recu,
            'statut'         => $out->statut,
            'message'        => $out->message,
        ], 201);
    }

    // =========================================================================
    // Cotisations exceptionnelles
    // =========================================================================

    public function indexCex(Request $request)
    {
        $query = DB::table('v_cotisations_exceptionnelles_status');

        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }
        if ($request->filled('member_id')) {
            $query->where('member_id', $request->member_id);  // note: vue expose member_id via join
        }

        return response()->json($query->orderByDesc('date_echeance')->get());
    }

    public function createCex(CreateCotisationExceptionnelleRequest $request)
    {
        $d = $request->validated();

        DB::statement(
            'CALL sp_create_cotisation_exceptionnelle(?,?,?,?,?,?,@nb,@msg)',
            [
                $d['member_id']     ?? null,
                $d['event_id']      ?? null,
                $d['libelle'],
                $d['montant_du'],
                $d['date_echeance'] ?? null,
                $request->user()->id,
            ]
        );

        $out = DB::selectOne('SELECT @nb AS nb_crees, @msg AS message');

        return response()->json([
            'nb_crees' => (int) $out->nb_crees,
            'message'  => $out->message,
        ], 201);
    }

    public function payCex(PayCotisationExceptionnelleRequest $request, int $id)
    {
        $d = $request->validated();

        DB::statement(
            'CALL sp_pay_cotisation_exceptionnelle(?,?,?,@recu,@statut,@msg)',
            [$id, $d['montant'], $request->user()->id]
        );

        $out = DB::selectOne('SELECT @recu AS recu, @statut AS statut, @msg AS message');

        if (! $out->recu) {
            return response()->json(['message' => $out->message], 422);
        }

        return response()->json([
            'reference_recu' => $out->recu,
            'statut'         => $out->statut,
            'message'        => $out->message,
        ]);
    }

    // =========================================================================
    // Dons
    // =========================================================================

    public function recordDon(RecordDonRequest $request)
    {
        $d = $request->validated();

        DB::statement(
            'CALL sp_record_don(?,?,?,?,?,?,?,@don_id,@recu,@msg)',
            [
                $d['member_id']     ?? null,
                $d['event_id']      ?? null,
                $d['donateur_nom']  ?? null,
                $d['montant'],
                $d['date_don']      ?? null,
                $d['motif']         ?? null,
                $request->user()->id,
            ]
        );

        $out = DB::selectOne('SELECT @don_id AS don_id, @recu AS recu, @msg AS message');

        if (! $out->don_id) {
            return response()->json(['message' => $out->message], 422);
        }

        return response()->json([
            'don_id'         => (int) $out->don_id,
            'reference_recu' => $out->recu,
            'message'        => $out->message,
        ], 201);
    }

    // =========================================================================
    // Dépenses
    // =========================================================================

    public function recordDepense(RecordDepenseRequest $request)
    {
        $d = $request->validated();

        DB::statement(
            'CALL sp_record_depense(?,?,?,?,?,?,?,?,@dep_id,@msg)',
            [
                $d['categorie_id'],
                $d['event_id']         ?? null,
                $d['libelle'],
                $d['montant'],
                $d['date_depense']     ?? null,
                $d['beneficiaire']     ?? null,
                $d['reference_piece']  ?? null,
                $request->user()->id,
            ]
        );

        $out = DB::selectOne('SELECT @dep_id AS depense_id, @msg AS message');

        if (! $out->depense_id) {
            return response()->json(['message' => $out->message], 422);
        }

        return response()->json([
            'depense_id' => (int) $out->depense_id,
            'message'    => $out->message,
        ], 201);
    }

    public function categoriesDepenses()
    {
        return response()->json(DB::table('categories_depenses')->get());
    }

    // =========================================================================
    // Caisse
    // =========================================================================

    public function caisse(int $exercice)
    {
        $caisse = DB::table('caisse')->where('exercice', $exercice)->first();

        return response()->json([
            'exercice' => $exercice,
            'solde'    => $caisse ? (float) $caisse->solde : 0.0,
        ]);
    }

    public function mouvements(Request $request, int $exercice)
    {
        $query = DB::table('caisse_mouvements')
            ->join('categories_depenses', 'categories_depenses.id', '=', 'caisse_mouvements.categorie_id', 'left')
            ->select(
                'caisse_mouvements.*',
                'categories_depenses.libelle AS categorie_libelle'
            )
            ->where('caisse_mouvements.exercice', $exercice);

        if ($request->filled('type')) {
            $query->where('caisse_mouvements.type', $request->type);
        }

        return response()->json(
            $query->orderByDesc('caisse_mouvements.created_at')->get()
        );
    }
}
