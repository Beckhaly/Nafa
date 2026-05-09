<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SendDiffusionJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries   = 3;
    public int $timeout = 60;

    public function __construct(private int $annonceId) {}

    public function handle(): void
    {
        $parametres = DB::table('parametres')->where('id', 1)->first();
        $enableSms = $parametres->enable_sms ?? true;
        $enableWhatsApp = $parametres->enable_whatsapp ?? true;

        $pending = DB::table('diffusions')
            ->where('annonce_id', $this->annonceId)
            ->where('statut', 'pending')
            ->get();

        foreach ($pending as $diffusion) {
            try {
                // Skip si le canal est désactivé
                if ($diffusion->canal === 'sms' && ! $enableSms) {
                    Log::info("Diffusion #{$diffusion->id} ignorée : SMS désactivé");
                    DB::statement(
                        'CALL sp_marquer_diffusion(?,?,?,?)',
                        [$diffusion->id, 'echec', null, 'SMS désactivé dans les paramètres']
                    );
                    continue;
                }

                if ($diffusion->canal === 'whatsapp' && ! $enableWhatsApp) {
                    Log::info("Diffusion #{$diffusion->id} ignorée : WhatsApp désactivé");
                    DB::statement(
                        'CALL sp_marquer_diffusion(?,?,?,?)',
                        [$diffusion->id, 'echec', null, 'WhatsApp désactivé dans les paramètres']
                    );
                    continue;
                }

                $ref = match ($diffusion->canal) {
                    'sms'      => $this->sendSms($diffusion->telephone, $this->getContenu()),
                    'whatsapp' => $this->sendWhatsApp($diffusion->telephone, $this->getContenu()),
                };

                DB::statement(
                    'CALL sp_marquer_diffusion(?,?,?,?)',
                    [$diffusion->id, 'envoye', $ref, null]
                );

            } catch (\Throwable $e) {
                Log::error("Diffusion #{$diffusion->id} échouée : " . $e->getMessage());

                DB::statement(
                    'CALL sp_marquer_diffusion(?,?,?,?)',
                    [$diffusion->id, 'echec', null, substr($e->getMessage(), 0, 500)]
                );
            }
        }
    }

    // =========================================================================
    // SMS
    // =========================================================================

    private function sendSms(string $to, string $body): string
    {
        return match (config('services.sms_provider', config('app.sms_provider', 'orange'))) {
            'orange'      => $this->sendSmsOrange($to, $body),
            'twilio'      => $this->sendSmsTwilio($to, $body),
            'smspro'      => $this->sendSmsSmsPro($to, $body),
            default       => throw new \RuntimeException('Provider SMS inconnu'),
        };
    }

    // ── Orange SMS API ────────────────────────────────────────────────────────

    private function orangeToken(): string
    {
        return Cache::remember('orange_sms_token', 3500, function () {
            $response = Http::asForm()
                ->withHeaders(['Authorization' => 'Basic ' . base64_encode(
                    config('services.orange.client_id') . ':' . config('services.orange.client_secret')
                )])
                ->post('https://api.orange.com/oauth/v3/token', [
                    'grant_type' => 'client_credentials',
                ]);

            throw_unless($response->successful(), \RuntimeException::class,
                'Orange token error: ' . $response->body());

            return $response->json('access_token');
        });
    }

    private function sendSmsOrange(string $to, string $body): string
    {
        $token      = $this->orangeToken();
        $senderAddr = config('services.orange.sms_from');
        $encoded    = rawurlencode($senderAddr);

        // Normaliser le numéro destinataire au format tel:+XXXXXXXXXXX
        $to = $this->normalizePhone($to);

        $response = Http::withToken($token)
            ->post("https://api.orange.com/smsmessaging/v1/outbound/{$encoded}/requests", [
                'outboundSMSMessageRequest' => [
                    'address'            => $to,
                    'senderAddress'      => $senderAddr,
                    'outboundSMSTextMessage' => ['message' => $body],
                    'senderName'         => config('services.orange.sender_name', 'Nafa'),
                ],
            ]);

        if (! $response->successful()) {
            // Token peut être expiré — on le purge et on réessaie une fois
            Cache::forget('orange_sms_token');
            $token = $this->orangeToken();

            $response = Http::withToken($token)
                ->post("https://api.orange.com/smsmessaging/v1/outbound/{$encoded}/requests", [
                    'outboundSMSMessageRequest' => [
                        'address'                => $to,
                        'senderAddress'          => $senderAddr,
                        'outboundSMSTextMessage' => ['message' => $body],
                        'senderName'             => config('services.orange.sender_name', 'Nafa'),
                    ],
                ]);

            throw_unless($response->successful(), \RuntimeException::class,
                'Orange SMS error: ' . $response->body());
        }

        return $response->json('outboundSMSMessageRequest.resourceURL') ?? 'orange-ok';
    }

    // ── Twilio SMS ────────────────────────────────────────────────────────────

    private function sendSmsTwilio(string $to, string $body): string
    {
        $sid   = config('services.twilio.sid');
        $token = config('services.twilio.token');
        $from  = config('services.twilio.from');

        $response = Http::withBasicAuth($sid, $token)
            ->asForm()
            ->post("https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json", [
                'To'   => $to,
                'From' => $from,
                'Body' => $body,
            ]);

        throw_unless($response->successful(), \RuntimeException::class, $response->body());

        return $response->json('sid');
    }

    // ── SMSPro Africa API ─────────────────────────────────────────────────────

    private function sendSmsSmsPro(string $to, string $body): string
    {
        $apiKey    = config('services.smspro.api_key');
        $senderID  = config('services.smspro.sender_id', 'NAFA');
        $endpoint  = config('services.smspro.endpoint', 'https://api.smspro.africa/send');

        // Normaliser le numéro de téléphone (retirer + et espaces)
        $phone = preg_replace('/[\s\+\-]/', '', $to);

        $response = Http::asJson()
            ->withHeaders([
                'Authorization' => "Bearer {$apiKey}",
            ])
            ->post($endpoint, [
                'phone'    => $phone,
                'message'  => $body,
                'sender_id' => $senderID,
            ]);

        throw_unless($response->successful(), \RuntimeException::class,
            'SMSPro error: ' . $response->body());

        // Récupère l'ID du message de la réponse
        // À adapter selon la structure réelle de la réponse SMSPro
        return $response->json('message_id') ?? $response->json('id') ?? 'smspro-ok';
    }

    // =========================================================================
    // WhatsApp
    // =========================================================================

    private function sendWhatsApp(string $to, string $body): string
    {
        return config('services.whatsapp.provider') === 'meta'
            ? $this->sendWhatsAppMeta($to, $body)
            : $this->sendWhatsAppTwilio($to, $body);
    }

    private function sendWhatsAppTwilio(string $to, string $body): string
    {
        $sid   = config('services.twilio.sid');
        $token = config('services.twilio.token');
        $from  = 'whatsapp:' . config('services.twilio.whatsapp_from');

        $response = Http::withBasicAuth($sid, $token)
            ->asForm()
            ->post("https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json", [
                'To'   => "whatsapp:{$to}",
                'From' => $from,
                'Body' => $body,
            ]);

        throw_unless($response->successful(), \RuntimeException::class, $response->body());

        return $response->json('sid');
    }

    private function sendWhatsAppMeta(string $to, string $body): string
    {
        $token   = config('services.whatsapp.meta_token');
        $phoneId = config('services.whatsapp.phone_number_id');

        $response = Http::withToken($token)
            ->post("https://graph.facebook.com/v19.0/{$phoneId}/messages", [
                'messaging_product' => 'whatsapp',
                'to'                => $to,
                'type'              => 'text',
                'text'              => ['body' => $body],
            ]);

        throw_unless($response->successful(), \RuntimeException::class, $response->body());

        return $response->json('messages.0.id');
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private function getContenu(): string
    {
        return DB::table('annonces')
            ->where('id', $this->annonceId)
            ->value('contenu') ?? '';
    }

    private function normalizePhone(string $phone): string
    {
        // Déjà au bon format
        if (str_starts_with($phone, 'tel:+')) return $phone;

        // Supprimer espaces et tirets
        $digits = preg_replace('/[\s\-\.]/', '', $phone);

        // Ajouter préfixe si absent
        if (! str_starts_with($digits, '+')) {
            $digits = '+' . ltrim($digits, '0');
        }

        return 'tel:' . $digits;
    }
}
