<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class MemberPortalController extends Controller
{
    private function memberId(): int
    {
        $mid = auth()->user()->member_id;
        abort_if(! $mid, 403, 'Ce compte n\'est pas lié à un membre.');
        return (int) $mid;
    }

    // =========================================================================
    // Dashboard
    // =========================================================================

    public function dashboard()
    {
        $mid   = $this->memberId();
        $annee = now()->year;

        $cacheKey = "dashboard_{$mid}_{$annee}";
        return Cache::remember($cacheKey, 1800, function() use ($mid, $annee) {
            $membre = DB::table('members')
            ->join('roles_membres', 'roles_membres.id', '=', 'members.role_id')
            ->select('members.*', 'roles_membres.libelle as role_libelle')
            ->where('members.id', $mid)
            ->first();

        $solde = DB::table('caisse')->where('exercice', $annee)->value('solde') ?? 0;

        $cotisations = DB::table('contributions')
            ->where('member_id', $mid)
            ->where('annee', $annee)
            ->orderBy('mois')
            ->get();

        // Total versé cette année
        $totalVerse = $cotisations->sum(fn($c) => (float) $c->montant_paye);

        // Mois en retard : mois passés non payés ou partiels
        $moisCourant = now()->month;
        $cotisationsRetard = $cotisations->filter(
            fn($c) => $c->mois <= $moisCourant && in_array($c->statut, ['unpaid', 'partial'])
        )->values();

        // Mois passés sans aucune ligne = aussi en retard
        $moisAvecLigne = $cotisations->pluck('mois')->toArray();
        $moisManquants = collect(range(1, $moisCourant))
            ->filter(fn($m) => ! in_array($m, $moisAvecLigne))
            ->map(fn($m) => (object)['mois' => $m, 'montant_du' => 0, 'montant_paye' => 0, 'statut' => 'unpaid'])
            ->values();
        $cotisationsRetard = $cotisationsRetard->merge($moisManquants)->sortBy('mois')->values();

        $cexPending = DB::table('cotisations_exceptionnelles')
            ->where('member_id', $mid)
            ->whereIn('statut', ['unpaid', 'partial'])
            ->count();

        // Dernières dépenses de l'association
        $dernieresDepenses = DB::table('depenses')
            ->join('categories_depenses', 'categories_depenses.id', '=', 'depenses.categorie_id')
            ->select('depenses.id', 'depenses.libelle', 'depenses.montant',
                     'depenses.date_depense', 'categories_depenses.libelle as categorie',
                     'categories_depenses.icone')
            ->orderByDesc('depenses.date_depense')
            ->limit(5)
            ->get();

        $prochainEvents = DB::table('events')
            ->join('types_evenement', 'types_evenement.id', '=', 'events.type_id')
            ->select('events.id', 'events.titre', 'events.date_debut',
                     'events.lieu', 'types_evenement.libelle as type')
            ->where('events.date_debut', '>=', now()->toDateString())
            ->orderBy('events.date_debut')
            ->limit(3)
            ->get();

            return [
                'membre'               => $membre,
                'annee'                => $annee,
                'solde_caisse'         => (float) $solde,
                'cotisations'          => $cotisations,
                'total_verse'          => $totalVerse,
                'cotisations_retard'   => $cotisationsRetard,
                'cex_pending'          => $cexPending,
                'dernieres_depenses'   => $dernieresDepenses,
                'prochains_events'     => $prochainEvents,
            ];
        });

        return response()->json(Cache::get($cacheKey));
    }

    // =========================================================================
    // Cotisations mensuelles
    // =========================================================================

    public function cotisations(int $annee)
    {
        $mid  = $this->memberId();
        $rows = DB::table('contributions')
            ->where('member_id', $mid)
            ->where('annee', $annee)
            ->orderBy('mois')
            ->get();
        return response()->json($rows);
    }

    // =========================================================================
    // Cotisations exceptionnelles
    // =========================================================================

    public function cotisationsExceptionnelles()
    {
        $mid  = $this->memberId();
        $rows = DB::table('v_cotisations_exceptionnelles_status as v')
            ->join('cotisations_exceptionnelles as ce', 'ce.id', '=', 'v.id')
            ->where('ce.member_id', $mid)
            ->select('v.*')
            ->orderByDesc('v.id')
            ->get();
        return response()->json($rows);
    }

    // =========================================================================
    // Prêts
    // =========================================================================

    public function prets()
    {
        $mid   = $this->memberId();
        $loans = DB::table('loans')
            ->where('member_id', $mid)
            ->orderByDesc('date_debut')
            ->get()
            ->map(function($loan) {
                $capitalRestant = DB::table('loan_schedule')
                    ->where('loan_id', $loan->id)
                    ->where('statut', '!=', 'paid')
                    ->sum('montant_principal');
                $loan->capital_restant_du = $capitalRestant;
                $loan->montant_principal = $loan->montant;
                return $loan;
            });
        return response()->json($loans);
    }

    // =========================================================================
    // Profil
    // =========================================================================

    public function profil()
    {
        $mid    = $this->memberId();
        $membre = DB::table('members')
            ->join('roles_membres', 'roles_membres.id', '=', 'members.role_id')
            ->select('members.*', 'roles_membres.libelle as role_libelle')
            ->where('members.id', $mid)
            ->first();
        abort_if(! $membre, 404, 'Membre introuvable.');
        return response()->json($membre);
    }

    // =========================================================================
    // Événements (liste publique)
    // =========================================================================

    public function evenements(Request $request)
    {
        $query = DB::table('events')
            ->join('types_evenement', 'types_evenement.id', '=', 'events.type_id')
            ->select('events.*', 'types_evenement.libelle as type')
            ->orderByDesc('events.date_debut');

        if ($request->filled('search')) {
            $q = '%' . $request->search . '%';
            $query->where('events.titre', 'like', $q);
        }

        return response()->json($query->get());
    }

    // =========================================================================
    // Annonces publiées
    // =========================================================================

    public function annonces(Request $request)
    {
        $query = DB::table('annonces')
            ->join('types_annonce', 'types_annonce.id', '=', 'annonces.type_id')
            ->leftJoin('members', 'members.id', '=', 'annonces.member_id')
            ->select('annonces.*',
                     'types_annonce.libelle as type', 'types_annonce.couleur',
                     DB::raw("CONCAT(members.nom, ' ', members.prenom, IFNULL(CONCAT(' (', members.alias, ')'), '')) AS membre_nom"))
            ->where('annonces.statut', 'publie')
            ->orderByDesc('annonces.published_at');

        if ($request->filled('type_id')) {
            $query->where('annonces.type_id', $request->type_id);
        }

        return response()->json($query->get());
    }
}
