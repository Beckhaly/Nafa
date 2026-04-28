<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class FinanceTest extends TestCase
{
    use RefreshDatabase;

    private int $memberId;

    protected function setUp(): void
    {
        parent::setUp();

        // Crée un membre actif pour les tests
        $this->actingAsAdmin()
            ->postJson('/api/members', [
                'nom'       => 'Test',
                'prenom'    => 'Finance',
                'telephone' => '+22490000099',
            ]);

        $this->memberId = DB::table('members')->value('id');
    }

    private function actingAsAdmin(): static
    {
        $role = DB::table('roles_utilisateurs')->where('code', 'admin')->first();
        $user = \App\Models\User::factory()->create(['role_id' => $role->id]);
        return $this->actingAs($user, 'sanctum');
    }

    // -------------------------------------------------------------------------
    // Cotisations mensuelles
    // -------------------------------------------------------------------------
    public function test_pay_contribution_returns_receipt(): void
    {
        $res = $this->actingAsAdmin()->postJson('/api/contributions/pay', [
            'member_id'  => $this->memberId,
            'annee'      => 2025,
            'mois'       => 4,
            'montant'    => 5000,
            'montant_du' => 5000,
        ]);

        $res->assertCreated()
            ->assertJsonPath('statut', 'paid')
            ->assertJsonPath('reference_recu', fn ($v) => str_starts_with($v, 'REC-'));
    }

    public function test_partial_payment_sets_partial_status(): void
    {
        $res = $this->actingAsAdmin()->postJson('/api/contributions/pay', [
            'member_id'  => $this->memberId,
            'annee'      => 2025,
            'mois'       => 5,
            'montant'    => 2000,
            'montant_du' => 5000,
        ]);

        $res->assertCreated()->assertJsonPath('statut', 'partial');
    }

    public function test_contribution_updates_caisse(): void
    {
        $this->actingAsAdmin()->postJson('/api/contributions/pay', [
            'member_id'  => $this->memberId,
            'annee'      => 2025,
            'mois'       => 6,
            'montant'    => 3000,
            'montant_du' => 3000,
        ])->assertCreated();

        $this->actingAsAdmin()
            ->getJson('/api/caisse/2025')
            ->assertOk()
            ->assertJsonPath('solde', 3000.0);
    }

    // -------------------------------------------------------------------------
    // Cotisations exceptionnelles
    // -------------------------------------------------------------------------
    public function test_create_cex_for_all_members(): void
    {
        $res = $this->actingAsAdmin()->postJson('/api/cotisations-exceptionnelles', [
            'libelle'    => 'Fête de fin d\'année',
            'montant_du' => 10000,
        ]);

        $res->assertCreated()
            ->assertJsonPath('nb_crees', 1);
    }

    public function test_pay_cex_receipt_starts_with_cex(): void
    {
        $this->actingAsAdmin()->postJson('/api/cotisations-exceptionnelles', [
            'libelle'    => 'Urgence',
            'montant_du' => 5000,
        ])->assertCreated();

        $cexId = DB::table('cotisations_exceptionnelles')->value('id');

        $this->actingAsAdmin()
            ->postJson("/api/cotisations-exceptionnelles/{$cexId}/pay", ['montant' => 5000])
            ->assertOk()
            ->assertJsonPath('reference_recu', fn ($v) => str_starts_with($v, 'CEX-'));
    }

    // -------------------------------------------------------------------------
    // Dépenses
    // -------------------------------------------------------------------------
    public function test_depense_fails_when_caisse_insufficient(): void
    {
        $cat = DB::table('categories_depenses')->value('id');

        $this->actingAsAdmin()->postJson('/api/depenses', [
            'categorie_id' => $cat,
            'libelle'      => 'Achat chaises',
            'montant'      => 999999,
        ])->assertUnprocessable();
    }

    public function test_depense_debits_caisse(): void
    {
        // Créditer d'abord
        $this->actingAsAdmin()->postJson('/api/contributions/pay', [
            'member_id'  => $this->memberId,
            'annee'      => 2025,
            'mois'       => 1,
            'montant'    => 50000,
            'montant_du' => 50000,
        ]);

        $cat = DB::table('categories_depenses')->value('id');

        $this->actingAsAdmin()->postJson('/api/depenses', [
            'categorie_id' => $cat,
            'libelle'      => 'Achat fournitures',
            'montant'      => 10000,
        ])->assertCreated();

        $this->actingAsAdmin()
            ->getJson('/api/caisse/2025')
            ->assertJsonPath('solde', 40000.0);
    }
}
