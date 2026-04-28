<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
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
        $pending = DB::table('diffusions')
            ->where('annonce_id', $this->annonceId)
            ->where('statut', 'pending')
            ->get();

        foreach ($pending as $diffusion) {
            try {
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

    // -------------------------------------------------------------------------
    // Envoi SMS via Twilio
    // -------------------------------------------------------------------------
    private function sendSms(string $to, string $body): string
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

    // -------------------------------------------------------------------------
    // Envoi WhatsApp via Twilio (sandbox whatsapp:+1415...)
    // ou Meta Cloud API selon config('services.whatsapp.provider')
    // -------------------------------------------------------------------------
    private function sendWhatsApp(string $to, string $body): string
    {
        if (config('services.whatsapp.provider') === 'meta') {
            return $this->sendWhatsAppMeta($to, $body);
        }

        // Twilio WhatsApp
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

    private function getContenu(): string
    {
        return DB::table('annonces')
            ->where('id', $this->annonceId)
            ->value('contenu') ?? '';
    }
}
