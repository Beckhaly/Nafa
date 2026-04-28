<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

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

    public function depensesParCategorie(int $annee)
    {
        return response()->json(
            DB::table('depenses')
                ->select('categories_depenses.libelle as categorie', DB::raw('SUM(depenses.montant) as montant'))
                ->join('categories_depenses', 'depenses.categorie_id', '=', 'categories_depenses.id')
                ->whereYear('depenses.date_depense', $annee)
                ->groupBy('depenses.categorie_id', 'categories_depenses.libelle')
                ->orderBy('montant', 'desc')
                ->get()
        );
    }

    // -------------------------------------------------------------------------
    // Récap cotisations par membre et par année
    // -------------------------------------------------------------------------

    public function recapCotisations(int $annee)
    {
        // Cotisations mensuelles
        $mensuel = DB::table('v_contribution_status as v')
            ->join('members as m', 'm.id', '=', 'v.member_id')
            ->where('v.annee', $annee)
            ->select(
                'v.member_id', 'v.matricule', 'v.nom_complet', 'v.role',
                'm.telephone', 'm.telephone2',
                'v.total_mois', 'v.mois_payes', 'v.mois_partiels', 'v.mois_impayes',
                'v.total_du as mens_du',
                'v.total_paye as mens_paye',
                'v.solde_restant as mens_solde',
                'v.taux_recouvrement as mens_taux'
            )
            ->orderBy('v.nom_complet')
            ->get()
            ->keyBy('member_id');

        // Cotisations exceptionnelles agrégées par membre pour l'année
        $cex = DB::table('cotisations_exceptionnelles as cex')
            ->join('members as m', 'm.id', '=', 'cex.member_id')
            ->whereYear(DB::raw('IFNULL(cex.date_echeance, NOW())'), $annee)
            ->groupBy('cex.member_id')
            ->select(
                'cex.member_id',
                DB::raw('SUM(cex.montant_du) as cex_du'),
                DB::raw('SUM(cex.montant_paye) as cex_paye'),
                DB::raw('SUM(cex.montant_du - cex.montant_paye) as cex_solde'),
                DB::raw('COUNT(*) as cex_nb')
            )
            ->get()
            ->keyBy('member_id');

        // Fusionner
        $rows = $mensuel->map(function ($m) use ($cex) {
            $c = $cex->get($m->member_id);
            $m->cex_du    = $c ? (float)$c->cex_du    : 0;
            $m->cex_paye  = $c ? (float)$c->cex_paye  : 0;
            $m->cex_solde = $c ? (float)$c->cex_solde : 0;
            $m->cex_nb    = $c ? (int)$c->cex_nb      : 0;

            $m->total_du       = (float)$m->mens_du    + $m->cex_du;
            $m->total_paye     = (float)$m->mens_paye  + $m->cex_paye;
            $m->solde_restant  = (float)$m->mens_solde + $m->cex_solde;
            $m->taux_global    = $m->total_du > 0
                ? round($m->total_paye / $m->total_du * 100, 1) : 100;
            return $m;
        })->values();

        $totaux = [
            'total_du'          => $rows->sum('total_du'),
            'total_paye'        => $rows->sum('total_paye'),
            'solde_restant'     => $rows->sum('solde_restant'),
            'mens_du'           => $rows->sum('mens_du'),
            'mens_paye'         => $rows->sum('mens_paye'),
            'cex_du'            => $rows->sum('cex_du'),
            'cex_paye'          => $rows->sum('cex_paye'),
            'taux_recouvrement' => $rows->sum('total_du') > 0
                ? round($rows->sum('total_paye') / $rows->sum('total_du') * 100, 1) : 0,
            'nb_membres'        => $rows->count(),
            'nb_a_jour'         => $rows->where('solde_restant', '<=', 0)->count(),
        ];

        return response()->json(compact('rows', 'totaux', 'annee'));
    }

    public function anneesDisponibles()
    {
        $annees = DB::table('contributions')->distinct()->orderBy('annee', 'desc')->pluck('annee');
        if ($annees->isEmpty()) {
            $annees = collect([now()->year]);
        }
        return response()->json($annees);
    }

    // -------------------------------------------------------------------------
    // Diffusion du récap de cotisations par SMS ou WhatsApp
    // -------------------------------------------------------------------------

    public function diffuserRecap(Request $request, int $annee)
    {
        $request->validate([
            'canal'      => 'required|in:sms,whatsapp',
            'member_ids' => 'nullable|array',
            'member_ids.*' => 'integer',
        ]);

        $canal      = $request->canal;
        $memberIds  = $request->member_ids ?? [];

        $query = DB::table('v_contribution_status as v')
            ->join('members as m', 'm.id', '=', 'v.member_id')
            ->where('v.annee', $annee)
            ->select('v.member_id', 'v.nom_complet', 'm.telephone',
                     'v.total_du', 'v.total_paye', 'v.solde_restant', 'v.taux_recouvrement');

        if (! empty($memberIds)) {
            $query->whereIn('v.member_id', $memberIds);
        }

        $membres = $query->get();
        $results = [];

        foreach ($membres as $m) {
            $telephone = $m->telephone;
            if (! $telephone) {
                $results[] = ['membre' => $m->nom_complet, 'statut' => 'echec', 'erreur' => 'Pas de téléphone'];
                continue;
            }

            $montantDu    = number_format($m->total_du,    0, ',', ' ');
            $montantPaye  = number_format($m->total_paye,  0, ',', ' ');
            $solde        = number_format($m->solde_restant, 0, ',', ' ');
            $taux         = number_format($m->taux_recouvrement, 1);

            $message = "NAFA - Recapitulatif cotisations {$annee}\n"
                     . "Membre : {$m->nom_complet}\n"
                     . "Attendu : {$montantDu} FCFA\n"
                     . "Recu    : {$montantPaye} FCFA\n"
                     . "Solde   : {$solde} FCFA\n"
                     . "Taux    : {$taux}%";

            try {
                if ($canal === 'sms') {
                    $ref = $this->sendSms($telephone, $message);
                } else {
                    $ref = $this->sendWhatsApp($telephone, $message);
                }
                $results[] = ['membre' => $m->nom_complet, 'statut' => 'envoye', 'ref' => $ref];
            } catch (\Throwable $e) {
                Log::error("Diffusion recap #{$m->member_id} : " . $e->getMessage());
                $results[] = ['membre' => $m->nom_complet, 'statut' => 'echec', 'erreur' => $e->getMessage()];
            }
        }

        $envoyes = collect($results)->where('statut', 'envoye')->count();
        return response()->json([
            'envoyes' => $envoyes,
            'total'   => count($results),
            'details' => $results,
        ]);
    }

    // ── Helpers envoi ─────────────────────────────────────────────────────────

    private function orangeToken(): string
    {
        return Cache::remember('orange_sms_token', 3500, function () {
            $response = Http::asForm()
                ->withHeaders(['Authorization' => 'Basic ' . base64_encode(
                    config('services.orange.client_id') . ':' . config('services.orange.client_secret')
                )])
                ->post('https://api.orange.com/oauth/v3/token', ['grant_type' => 'client_credentials']);
            throw_unless($response->successful(), \RuntimeException::class, 'Orange token: ' . $response->body());
            return $response->json('access_token');
        });
    }

    private function sendSms(string $to, string $body): string
    {
        return match (config('services.sms_provider', 'orange')) {
            'orange' => $this->sendSmsOrange($to, $body),
            'twilio' => $this->sendSmsTwilio($to, $body),
            default  => throw new \RuntimeException('Provider SMS inconnu'),
        };
    }

    private function sendSmsOrange(string $to, string $body): string
    {
        $token      = $this->orangeToken();
        $senderAddr = config('services.orange.sms_from');
        $encoded    = rawurlencode($senderAddr);
        $to         = $this->normalizePhone($to);

        $response = Http::withToken($token)
            ->post("https://api.orange.com/smsmessaging/v1/outbound/{$encoded}/requests", [
                'outboundSMSMessageRequest' => [
                    'address'                => $to,
                    'senderAddress'          => $senderAddr,
                    'outboundSMSTextMessage' => ['message' => $body],
                    'senderName'             => config('services.orange.sender_name', 'Nafa'),
                ],
            ]);

        if (! $response->successful()) {
            Cache::forget('orange_sms_token');
            $token    = $this->orangeToken();
            $response = Http::withToken($token)
                ->post("https://api.orange.com/smsmessaging/v1/outbound/{$encoded}/requests", [
                    'outboundSMSMessageRequest' => [
                        'address'                => $to,
                        'senderAddress'          => $senderAddr,
                        'outboundSMSTextMessage' => ['message' => $body],
                        'senderName'             => config('services.orange.sender_name', 'Nafa'),
                    ],
                ]);
            throw_unless($response->successful(), \RuntimeException::class, 'Orange SMS: ' . $response->body());
        }

        return $response->json('outboundSMSMessageRequest.resourceURL') ?? 'orange-ok';
    }

    private function sendSmsTwilio(string $to, string $body): string
    {
        $sid   = config('services.twilio.sid');
        $token = config('services.twilio.token');
        $response = Http::withBasicAuth($sid, $token)->asForm()
            ->post("https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json", [
                'To' => $to, 'From' => config('services.twilio.from'), 'Body' => $body,
            ]);
        throw_unless($response->successful(), \RuntimeException::class, $response->body());
        return $response->json('sid');
    }

    private function sendWhatsApp(string $to, string $body): string
    {
        if (config('services.whatsapp.provider') === 'meta') {
            $token    = config('services.whatsapp.meta_token');
            $phoneId  = config('services.whatsapp.phone_number_id');
            $response = Http::withToken($token)
                ->post("https://graph.facebook.com/v19.0/{$phoneId}/messages", [
                    'messaging_product' => 'whatsapp',
                    'to'   => $to,
                    'type' => 'text',
                    'text' => ['body' => $body],
                ]);
            throw_unless($response->successful(), \RuntimeException::class, $response->body());
            return $response->json('messages.0.id');
        }

        $sid   = config('services.twilio.sid');
        $token = config('services.twilio.token');
        $response = Http::withBasicAuth($sid, $token)->asForm()
            ->post("https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json", [
                'To'   => "whatsapp:{$to}",
                'From' => 'whatsapp:' . config('services.twilio.whatsapp_from'),
                'Body' => $body,
            ]);
        throw_unless($response->successful(), \RuntimeException::class, $response->body());
        return $response->json('sid');
    }

    private function normalizePhone(string $phone): string
    {
        if (str_starts_with($phone, 'tel:+')) return $phone;
        $digits = preg_replace('/[\s\-\.]/', '', $phone);
        if (! str_starts_with($digits, '+')) {
            $digits = '+' . ltrim($digits, '0');
        }
        return 'tel:' . $digits;
    }
}
