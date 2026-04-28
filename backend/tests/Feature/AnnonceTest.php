<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AnnonceTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsAdmin(): static
    {
        $role = DB::table('roles_utilisateurs')->where('code', 'admin')->first();
        $user = \App\Models\User::factory()->create(['role_id' => $role->id]);
        return $this->actingAs($user, 'sanctum');
    }

    private function createMember(): int
    {
        $this->actingAsAdmin()->postJson('/api/members', [
            'nom' => 'Membre', 'prenom' => 'Test', 'telephone' => '+22490000077',
        ]);
        return DB::table('members')->value('id');
    }

    private function typeId(): int
    {
        return DB::table('types_annonce')->where('libelle', 'Mariage')->value('id');
    }

    public function test_create_annonce_as_brouillon(): void
    {
        $res = $this->actingAsAdmin()->postJson('/api/annonces', [
            'type_id' => $this->typeId(),
            'titre'   => 'Mariage de Koné',
            'contenu' => 'L\'association annonce le mariage de M. Koné le 15/06/2025.',
        ]);

        $res->assertCreated();
    }

    public function test_annonce_visible_with_type_and_couleur(): void
    {
        $id = $this->actingAsAdmin()->postJson('/api/annonces', [
            'type_id' => $this->typeId(),
            'titre'   => 'Test',
            'contenu' => 'Corps du message.',
        ])->json('id');

        $this->actingAsAdmin()
            ->getJson("/api/annonces/{$id}")
            ->assertOk()
            ->assertJsonStructure(['type', 'type_couleur']);
    }

    public function test_publier_creates_pending_diffusions(): void
    {
        $this->createMember();

        $id = $this->actingAsAdmin()->postJson('/api/annonces', [
            'type_id' => $this->typeId(),
            'titre'   => 'Annonce test',
            'contenu' => 'Message de test.',
        ])->json('id');

        // Mock SendDiffusionJob pour éviter l'appel API réel
        \Illuminate\Support\Facades\Queue::fake();

        $res = $this->actingAsAdmin()->postJson("/api/annonces/{$id}/publier", [
            'canal' => 'sms',
        ]);

        $res->assertOk()
            ->assertJsonPath('nb_sms', 1);

        $this->assertEquals(1, DB::table('diffusions')->where('annonce_id', $id)->count());
        $this->assertEquals('pending', DB::table('diffusions')->value('statut'));
    }

    public function test_cannot_publish_archived_annonce(): void
    {
        $id = $this->actingAsAdmin()->postJson('/api/annonces', [
            'type_id' => $this->typeId(),
            'titre'   => 'A archiver',
            'contenu' => 'Corps.',
        ])->json('id');

        DB::table('annonces')->where('id', $id)->update(['statut' => 'archive']);

        $this->actingAsAdmin()
            ->postJson("/api/annonces/{$id}/publier", ['canal' => 'sms'])
            ->assertUnprocessable();
    }

    public function test_types_annonce_includes_mariage(): void
    {
        $types = $this->actingAsAdmin()
            ->getJson('/api/types-annonce')
            ->assertOk()
            ->json();

        $libelles = array_column($types, 'libelle');
        $this->assertContains('Mariage', $libelles);
        $this->assertContains('Décès',   $libelles);
        $this->assertContains('Baptême', $libelles);
    }
}
