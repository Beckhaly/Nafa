<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MemberTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------
    private function actingAsAdmin(): static
    {
        $role = \DB::table('roles_utilisateurs')->where('code', 'admin')->first();
        $user = \App\Models\User::factory()->create(['role_id' => $role->id]);
        return $this->actingAs($user, 'sanctum');
    }

    private function memberPayload(array $overrides = []): array
    {
        return array_merge([
            'nom'       => 'Diallo',
            'prenom'    => 'Mamadou',
            'telephone' => '+22490000001',
            'email'     => 'mamadou@example.com',
        ], $overrides);
    }

    // -------------------------------------------------------------------------
    // Auth guard
    // -------------------------------------------------------------------------
    public function test_unauthenticated_cannot_access_members(): void
    {
        $this->getJson('/api/members')->assertUnauthorized();
    }

    // -------------------------------------------------------------------------
    // Create
    // -------------------------------------------------------------------------
    public function test_create_member_returns_matricule(): void
    {
        $res = $this->actingAsAdmin()
            ->postJson('/api/members', $this->memberPayload());

        $res->assertCreated()
            ->assertJsonPath('matricule', fn ($v) => str_starts_with($v, 'MBR-'));
    }

    public function test_create_member_with_alias(): void
    {
        $res = $this->actingAsAdmin()
            ->postJson('/api/members', $this->memberPayload(['alias' => 'Petit']));

        $res->assertCreated();

        $member = $this->actingAsAdmin()
            ->getJson('/api/members/' . $res->json('id'))
            ->assertOk()
            ->json();

        $this->assertStringContainsString('(Petit)', $member['nom_complet']);
    }

    public function test_duplicate_email_returns_422(): void
    {
        $payload = $this->memberPayload();

        $this->actingAsAdmin()->postJson('/api/members', $payload)->assertCreated();

        $this->actingAsAdmin()
            ->postJson('/api/members', array_merge($payload, ['telephone' => '+22490000002']))
            ->assertUnprocessable();
    }

    public function test_duplicate_telephone_returns_422(): void
    {
        $payload = $this->memberPayload();
        $this->actingAsAdmin()->postJson('/api/members', $payload)->assertCreated();

        $this->actingAsAdmin()
            ->postJson('/api/members', array_merge($payload, ['email' => 'other@example.com']))
            ->assertUnprocessable();
    }

    // -------------------------------------------------------------------------
    // Read
    // -------------------------------------------------------------------------
    public function test_list_members(): void
    {
        $this->actingAsAdmin()->postJson('/api/members', $this->memberPayload())->assertCreated();

        $this->actingAsAdmin()
            ->getJson('/api/members')
            ->assertOk()
            ->assertJsonCount(1);
    }

    public function test_show_member_contains_nom_complet(): void
    {
        $id = $this->actingAsAdmin()
            ->postJson('/api/members', $this->memberPayload(['alias' => 'Mali']))
            ->json('id');

        $this->actingAsAdmin()
            ->getJson("/api/members/{$id}")
            ->assertOk()
            ->assertJsonPath('nom_complet', 'Diallo Mamadou (Mali)');
    }

    public function test_show_nonexistent_member_returns_404(): void
    {
        $this->actingAsAdmin()->getJson('/api/members/9999')->assertNotFound();
    }

    // -------------------------------------------------------------------------
    // Update
    // -------------------------------------------------------------------------
    public function test_update_member(): void
    {
        $id = $this->actingAsAdmin()
            ->postJson('/api/members', $this->memberPayload())
            ->json('id');

        $this->actingAsAdmin()
            ->putJson("/api/members/{$id}", $this->memberPayload(['nom' => 'Koné']))
            ->assertOk();

        $this->actingAsAdmin()
            ->getJson("/api/members/{$id}")
            ->assertJsonPath('nom', 'Koné');
    }

    // -------------------------------------------------------------------------
    // Roles reference
    // -------------------------------------------------------------------------
    public function test_roles_list_is_ordered(): void
    {
        $roles = $this->actingAsAdmin()
            ->getJson('/api/roles-membres')
            ->assertOk()
            ->json();

        $this->assertEquals('Président', $roles[0]['libelle']);
    }
}
