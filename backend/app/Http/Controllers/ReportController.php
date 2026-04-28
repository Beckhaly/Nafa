<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function kpi()
    {
        return response()->json(DB::table('v_dashboard_kpi')->first());
    }

    public function pivot(int $annee)
    {
        $rows = DB::select('CALL sp_get_monthly_pivot(?)', [$annee]);

        return response()->json($rows);
    }

    public function recettesDepenses()
    {
        return response()->json(DB::table('v_recettes_vs_depenses')->get());
    }

    public function creances()
    {
        return response()->json(DB::table('v_creances_en_souffrance')->get());
    }

    public function contributionStatus(int $annee)
    {
        return response()->json(
            DB::table('v_contribution_status')
                ->where('annee', $annee)
                ->orderBy('matricule')
                ->get()
        );
    }
}
