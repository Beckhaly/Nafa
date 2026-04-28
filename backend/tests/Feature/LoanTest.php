<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class LoanTest extends TestCase
{
    use RefreshDatabase;

    private int $memberId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAsAdmin()->postJson('/api/members', [
            'nom' => 'Test', 'prenom' => 'Loan', 'telephone' => '+22490000088',
        ]);
        $this->memberId = DB::table('members')->value('id');
    }

    private function actingAsAdmin(): static
    {
        $role = DB::table('roles_utilisateurs')->where('code', 'admin')->first();
        $user = \App\Models\User::factory()->create(['role_id' => $role->id]);
        return $this->actingAs($user, 'sanctum');
    }

    public function test_create_loan_generates_schedule(): void
    {
        $res = $this->actingAsAdmin()->postJson('/api/loans', [
            'member_id'    => $this->memberId,
            'montant'      => 120000,
            'taux_interet' => 12,
            'duree_mois'   => 12,
        ]);

        $res->assertCreated()
            ->assertJsonStructure(['loan_id', 'mensualite']);

        $loanId = $res->json('loan_id');
        $schedule = $this->actingAsAdmin()
            ->getJson("/api/loans/{$loanId}/schedule")
            ->assertOk()
            ->json();

        $this->assertCount(12, $schedule);
    }

    public function test_mensualite_is_positive(): void
    {
        $res = $this->actingAsAdmin()->postJson('/api/loans', [
            'member_id'    => $this->memberId,
            'montant'      => 60000,
            'taux_interet' => 0,
            'duree_mois'   => 6,
        ]);

        $res->assertCreated();
        $this->assertGreaterThan(0, $res->json('mensualite'));
    }

    public function test_loan_appears_in_list(): void
    {
        $this->actingAsAdmin()->postJson('/api/loans', [
            'member_id'    => $this->memberId,
            'montant'      => 50000,
            'taux_interet' => 10,
            'duree_mois'   => 6,
        ])->assertCreated();

        $this->actingAsAdmin()
            ->getJson('/api/loans')
            ->assertOk()
            ->assertJsonCount(1);
    }

    public function test_show_loan_contains_nom_complet(): void
    {
        $loanId = $this->actingAsAdmin()->postJson('/api/loans', [
            'member_id'    => $this->memberId,
            'montant'      => 30000,
            'taux_interet' => 5,
            'duree_mois'   => 3,
        ])->json('loan_id');

        $this->actingAsAdmin()
            ->getJson("/api/loans/{$loanId}")
            ->assertOk()
            ->assertJsonStructure(['nom_complet']);
    }

    public function test_invalid_member_returns_422(): void
    {
        $this->actingAsAdmin()->postJson('/api/loans', [
            'member_id'    => 9999,
            'montant'      => 10000,
            'taux_interet' => 5,
            'duree_mois'   => 6,
        ])->assertUnprocessable();
    }
}
