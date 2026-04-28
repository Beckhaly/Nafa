<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Requests\CreateLoanRequest;

class LoanController extends Controller
{
    public function index(Request $request)
    {
        $query = DB::table('v_loan_summary');

        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }
        if ($request->filled('member_id')) {
            $query->where('member_id', $request->member_id);
        }

        return response()->json($query->orderByDesc('loan_id')->get());
    }

    public function store(CreateLoanRequest $request)
    {
        $d = $request->validated();

        DB::statement(
            'CALL sp_generate_loan_schedule(?,?,?,?,?,?,@loan_id,@mensualite,@msg)',
            [
                $d['member_id'],
                $d['montant'],
                $d['taux_interet'],
                $d['duree_mois'],
                $d['date_debut'] ?? null,
                $request->user()->id,
            ]
        );

        $out = DB::selectOne('SELECT @loan_id AS loan_id, @mensualite AS mensualite, @msg AS message');

        if (! $out->loan_id) {
            return response()->json(['message' => $out->message], 422);
        }

        return response()->json([
            'loan_id'    => (int) $out->loan_id,
            'mensualite' => (float) $out->mensualite,
            'message'    => $out->message,
        ], 201);
    }

    public function show(int $id)
    {
        $loan = DB::table('v_loan_summary')->where('loan_id', $id)->first();
        abort_unless($loan, 404, 'Prêt introuvable');

        return response()->json($loan);
    }

    public function schedule(int $id)
    {
        abort_unless(DB::table('loans')->where('id', $id)->exists(), 404, 'Prêt introuvable');

        $schedule = DB::table('loan_schedule')
            ->where('loan_id', $id)
            ->orderBy('numero_echeance')
            ->get();

        return response()->json($schedule);
    }

    public function updateStatuts()
    {
        DB::statement('CALL sp_update_loan_statuts()');

        return response()->json(['message' => 'Statuts mis à jour.']);
    }
}
