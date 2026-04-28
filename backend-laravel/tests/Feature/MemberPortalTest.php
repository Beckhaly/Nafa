<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

class MemberPortalTest extends TestCase
{
    use RefreshDatabase;

    // =========================================================================
    // Auth layer — unauthenticated
    // =========================================================================

    public function test_unauthenticated_cannot_access_portail_dashboard()
    {
        $this->getJson('/api/portail/dashboard')->assertStatus(401);
    }

    public function test_unauthenticated_cannot_access_portail_profil()
    {
        $this->getJson('/api/portail/profil')->assertStatus(401);
    }

    public function test_unauthenticated_cannot_access_portail_cotisations()
    {
        $this->getJson('/api/portail/cotisations/2026')->assertStatus(401);
    }

    public function test_unauthenticated_cannot_access_portail_prets()
    {
        $this->getJson('/api/portail/prets')->assertStatus(401);
    }

    public function test_unauthenticated_cannot_access_portail_evenements()
    {
        $this->getJson('/api/portail/evenements')->assertStatus(401);
    }

    public function test_unauthenticated_cannot_access_portail_annonces()
    {
        $this->getJson('/api/portail/annonces')->assertStatus(401);
    }

    public function test_change_password_requires_auth()
    {
        $this->postJson('/api/auth/change-password', [
            'current_password'          => 'test',
            'new_password'              => 'newtest123',
            'new_password_confirmation' => 'newtest123',
        ])->assertStatus(401);
    }

    // =========================================================================
    // Auth layer — user without member_id → 403 on portail endpoints
    // =========================================================================

    public function test_user_without_member_id_cannot_access_dashboard()
    {
        $user = User::factory()->create(['member_id' => null]);

        $this->actingAs($user)
             ->getJson('/api/portail/dashboard')
             ->assertStatus(403);
    }

    public function test_user_without_member_id_cannot_access_profil()
    {
        $user = User::factory()->create(['member_id' => null]);

        $this->actingAs($user)
             ->getJson('/api/portail/profil')
             ->assertStatus(403);
    }

    public function test_user_without_member_id_cannot_access_cotisations()
    {
        $user = User::factory()->create(['member_id' => null]);

        $this->actingAs($user)
             ->getJson('/api/portail/cotisations/2026')
             ->assertStatus(403);
    }

    public function test_user_without_member_id_cannot_access_prets()
    {
        $user = User::factory()->create(['member_id' => null]);

        $this->actingAs($user)
             ->getJson('/api/portail/prets')
             ->assertStatus(403);
    }

    // =========================================================================
    // Password change — authenticated
    // =========================================================================

    public function test_change_password_validates_current_password()
    {
        $user = User::factory()->create([
            'password' => Hash::make('correct_password'),
        ]);

        $this->actingAs($user)
             ->postJson('/api/auth/change-password', [
                 'current_password'          => 'wrong_password',
                 'new_password'              => 'newpass123',
                 'new_password_confirmation' => 'newpass123',
             ])
             ->assertStatus(422)
             ->assertJsonValidationErrors('current_password');
    }

    public function test_change_password_succeeds_with_correct_current_password()
    {
        $user = User::factory()->create([
            'password' => Hash::make('correct_password'),
        ]);

        $this->actingAs($user)
             ->postJson('/api/auth/change-password', [
                 'current_password'          => 'correct_password',
                 'new_password'              => 'newpassword123',
                 'new_password_confirmation' => 'newpassword123',
             ])
             ->assertStatus(200)
             ->assertJson(['message' => 'Mot de passe modifié avec succès.']);
    }

    public function test_change_password_requires_confirmation()
    {
        $user = User::factory()->create([
            'password' => Hash::make('correct_password'),
        ]);

        $this->actingAs($user)
             ->postJson('/api/auth/change-password', [
                 'current_password'          => 'correct_password',
                 'new_password'              => 'newpassword123',
                 'new_password_confirmation' => 'does_not_match',
             ])
             ->assertStatus(422)
             ->assertJsonValidationErrors('new_password');
    }

    public function test_new_password_must_be_at_least_8_chars()
    {
        $user = User::factory()->create([
            'password' => Hash::make('correct_password'),
        ]);

        $this->actingAs($user)
             ->postJson('/api/auth/change-password', [
                 'current_password'          => 'correct_password',
                 'new_password'              => 'short',
                 'new_password_confirmation' => 'short',
             ])
             ->assertStatus(422)
             ->assertJsonValidationErrors('new_password');
    }

    // =========================================================================
    // Login
    // =========================================================================

    public function test_login_fails_with_wrong_credentials()
    {
        User::factory()->create([
            'email'    => 'test@example.com',
            'password' => Hash::make('password'),
            'is_active' => 1,
        ]);

        $this->postJson('/api/auth/login', [
            'login'    => 'test@example.com',
            'password' => 'wrongpassword',
        ])->assertStatus(422);
    }

    public function test_login_requires_login_and_password()
    {
        $this->postJson('/api/auth/login', [])
             ->assertStatus(422)
             ->assertJsonValidationErrors(['login', 'password']);
    }
}
