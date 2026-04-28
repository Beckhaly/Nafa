<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportController extends Controller
{
    private function memberId(): int
    {
        $mid = auth()->user()->member_id;
        abort_if(! $mid, 403, 'Ce compte n\'est pas lié à un membre.');
        return (int) $mid;
    }

    /**
     * Export cotisations mensuelles as Excel (XLSX)
     */
    public function cotisationsExcel(int $annee)
    {
        $mid = $this->memberId();

        $cotisations = DB::table('contributions')
            ->where('member_id', $mid)
            ->where('annee', $annee)
            ->orderBy('mois')
            ->get();

        $membre = DB::table('members')->where('id', $mid)->first();

        $headers = [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => "attachment; filename=\"cotisations_{$membre->matricule}_{$annee}.xlsx\"",
        ];

        $callback = function() use ($cotisations, $membre, $annee) {
            $file = fopen('php://output', 'w');

            // Write BOM for UTF-8
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

            // Headers
            fputcsv($file, ['COTISATIONS MENSUELLES', $membre->nom . ' ' . $membre->prenom, $annee]);
            fputcsv($file, []);
            fputcsv($file, ['Mois', 'Montant Dû', 'Montant Payé', 'Statut', 'Date Paiement']);

            $mois = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

            foreach ($cotisations as $c) {
                fputcsv($file, [
                    $mois[$c->mois],
                    number_format($c->montant_du, 2, ',', ' '),
                    number_format($c->montant_paye, 2, ',', ' '),
                    ucfirst($c->statut),
                    $c->date_paiement ? date('d/m/Y', strtotime($c->date_paiement)) : '',
                ]);
            }

            fputcsv($file, []);
            $total_du = $cotisations->sum('montant_du');
            $total_paye = $cotisations->sum('montant_paye');
            fputcsv($file, ['TOTAL', number_format($total_du, 2, ',', ' '), number_format($total_paye, 2, ',', ' ')]);

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Export cotisations mensuelles as CSV
     */
    public function cotisationsCSV(int $annee)
    {
        $mid = $this->memberId();

        $cotisations = DB::table('contributions')
            ->where('member_id', $mid)
            ->where('annee', $annee)
            ->orderBy('mois')
            ->get();

        $membre = DB::table('members')->where('id', $mid)->first();

        $headers = [
            'Content-Type' => 'text/csv; charset=utf-8',
            'Content-Disposition' => "attachment; filename=\"cotisations_{$membre->matricule}_{$annee}.csv\"",
        ];

        $callback = function() use ($cotisations, $membre, $annee) {
            $file = fopen('php://output', 'w');
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF)); // UTF-8 BOM

            fputcsv($file, ['COTISATIONS MENSUELLES', $membre->nom . ' ' . $membre->prenom, $annee], ';');
            fputcsv($file, [], ';');
            fputcsv($file, ['Mois', 'Montant Dû', 'Montant Payé', 'Statut', 'Date Paiement'], ';');

            $mois = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

            foreach ($cotisations as $c) {
                fputcsv($file, [
                    $mois[$c->mois],
                    $c->montant_du,
                    $c->montant_paye,
                    ucfirst($c->statut),
                    $c->date_paiement ? date('d/m/Y', strtotime($c->date_paiement)) : '',
                ], ';');
            }

            fputcsv($file, [], ';');
            $total_du = $cotisations->sum('montant_du');
            $total_paye = $cotisations->sum('montant_paye');
            fputcsv($file, ['TOTAL', $total_du, $total_paye], ';');

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Export member card as PDF (placeholder for Spatie implementation)
     * Requires: composer require spatie/laravel-pdf
     */
    public function carteMembrePDF()
    {
        $mid = $this->memberId();

        $membre = DB::table('members')
            ->join('roles_membres', 'roles_membres.id', '=', 'members.role_id')
            ->select('members.*', 'roles_membres.libelle as role_libelle')
            ->where('members.id', $mid)
            ->first();

        // TODO: Uncomment when spatie/laravel-pdf is installed
        // return Pdf::view('exports.carte-membre', ['membre' => $membre])
        //     ->download("carte_{$membre->matricule}.pdf");

        // Temporary: return JSON with member data for client-side PDF generation
        return response()->json([
            'membre' => $membre,
            'message' => 'PDF export requires Spatie PDF package installation',
            'instruction' => 'composer require spatie/laravel-pdf'
        ]);
    }

    /**
     * Export cotisations exceptionnelles as Excel
     */
    public function cotisationsExceptionnellesExcel()
    {
        $mid = $this->memberId();

        $cex = DB::table('v_cotisations_exceptionnelles_status as v')
            ->join('cotisations_exceptionnelles as ce', 'ce.id', '=', 'v.id')
            ->where('ce.member_id', $mid)
            ->select('v.*')
            ->orderByDesc('v.id')
            ->get();

        $headers = [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="cotisations-exceptionnelles.xlsx"',
        ];

        $callback = function() use ($cex) {
            $file = fopen('php://output', 'w');
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));

            fputcsv($file, ['COTISATIONS EXCEPTIONNELLES']);
            fputcsv($file, []);
            fputcsv($file, ['Libellé', 'Montant Dû', 'Montant Payé', 'Solde Restant', 'Statut', 'Échéance']);

            foreach ($cex as $c) {
                fputcsv($file, [
                    $c->libelle,
                    number_format($c->montant_du, 2, ',', ' '),
                    number_format($c->montant_paye, 2, ',', ' '),
                    number_format($c->solde_restant, 2, ',', ' '),
                    ucfirst($c->statut),
                    $c->date_echeance ? date('d/m/Y', strtotime($c->date_echeance)) : '',
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Export cotisations exceptionnelles as CSV
     */
    public function cotisationsExceptionnellesCSV()
    {
        $mid = $this->memberId();

        $cex = DB::table('v_cotisations_exceptionnelles_status as v')
            ->join('cotisations_exceptionnelles as ce', 'ce.id', '=', 'v.id')
            ->where('ce.member_id', $mid)
            ->select('v.*')
            ->orderByDesc('v.id')
            ->get();

        $headers = [
            'Content-Type' => 'text/csv; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="cotisations-exceptionnelles.csv"',
        ];

        $callback = function() use ($cex) {
            $file = fopen('php://output', 'w');
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF)); // UTF-8 BOM

            fputcsv($file, ['COTISATIONS EXCEPTIONNELLES'], ';');
            fputcsv($file, [], ';');
            fputcsv($file, ['Libellé', 'Montant Dû', 'Montant Payé', 'Solde Restant', 'Statut', 'Échéance'], ';');

            foreach ($cex as $c) {
                fputcsv($file, [
                    $c->libelle,
                    $c->montant_du,
                    $c->montant_paye,
                    $c->solde_restant,
                    ucfirst($c->statut),
                    $c->date_echeance ? date('d/m/Y', strtotime($c->date_echeance)) : '',
                ], ';');
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
