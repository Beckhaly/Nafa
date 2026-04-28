<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\LoanController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\AnnonceController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ParametreController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\MemberPortalController;
use App\Http\Controllers\ExportController;

// =============================================================================
// Auth (public)
// =============================================================================
Route::prefix('auth')->group(function () {
    Route::post('login',  [AuthController::class, 'login']);
    Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
    Route::get ('me',     [AuthController::class, 'me'])->middleware('auth:sanctum');
    Route::post('change-password', [AuthController::class, 'changePassword'])->middleware('auth:sanctum');
});

// =============================================================================
// Protected routes
// =============================================================================
Route::middleware('auth:sanctum')->group(function () {

    // -------------------------------------------------------------------------
    // Membres
    // -------------------------------------------------------------------------
    Route::get    ('members',         [MemberController::class, 'index']);
    Route::post   ('members',         [MemberController::class, 'store']);
    Route::get    ('members/{id}',    [MemberController::class, 'show']);
    Route::put    ('members/{id}',    [MemberController::class, 'update']);
    Route::delete ('members/{id}',    [MemberController::class, 'destroy']);
    Route::get    ('members/{id}/card', [MemberController::class, 'card']);

    // Référentiel rôles
    Route::get('roles-membres',      [MemberController::class, 'roles']);

    // -------------------------------------------------------------------------
    // Cotisations mensuelles
    // -------------------------------------------------------------------------
    Route::post('contributions/pay', [FinanceController::class, 'payContribution']);

    // -------------------------------------------------------------------------
    // Cotisations exceptionnelles
    // -------------------------------------------------------------------------
    Route::get  ('cotisations-exceptionnelles',           [FinanceController::class, 'indexCex']);
    Route::post ('cotisations-exceptionnelles',           [FinanceController::class, 'createCex']);
    Route::post ('cotisations-exceptionnelles/{id}/pay',  [FinanceController::class, 'payCex']);

    // -------------------------------------------------------------------------
    // Dons & Dépenses
    // -------------------------------------------------------------------------
    Route::post('dons',     [FinanceController::class, 'recordDon']);
    Route::post('depenses', [FinanceController::class, 'recordDepense']);
    Route::get ('categories-depenses', [FinanceController::class, 'categoriesDepenses']);

    // Situation de caisse
    Route::get('caisse/{exercice}',           [FinanceController::class, 'caisse']);
    Route::get('caisse/{exercice}/mouvements', [FinanceController::class, 'mouvements']);

    // -------------------------------------------------------------------------
    // Prêts
    // -------------------------------------------------------------------------
    Route::get  ('loans',          [LoanController::class, 'index']);
    Route::post ('loans',          [LoanController::class, 'store']);
    Route::get  ('loans/{id}',     [LoanController::class, 'show']);
    Route::get  ('loans/{id}/schedule', [LoanController::class, 'schedule']);
    Route::post ('loans/update-statuts', [LoanController::class, 'updateStatuts']);

    // -------------------------------------------------------------------------
    // Événements
    // -------------------------------------------------------------------------
    Route::get    ('events',                        [EventController::class, 'index']);
    Route::post   ('events',                        [EventController::class, 'store']);
    Route::get    ('events/{id}',                   [EventController::class, 'show']);
    Route::put    ('events/{id}',                   [EventController::class, 'update']);
    Route::post   ('events/{id}/participants',      [EventController::class, 'addParticipant']);
    Route::put    ('events/{id}/participants/{mid}',[EventController::class, 'updateParticipant']);
    Route::get    ('types-evenement',               [EventController::class, 'types']);

    // -------------------------------------------------------------------------
    // Annonces & Diffusion SMS/WhatsApp
    // -------------------------------------------------------------------------
    Route::get    ('annonces',               [AnnonceController::class, 'index']);
    Route::post   ('annonces',               [AnnonceController::class, 'store']);
    Route::get    ('annonces/{id}',          [AnnonceController::class, 'show']);
    Route::put    ('annonces/{id}',          [AnnonceController::class, 'update']);
    Route::post   ('annonces/{id}/publier',  [AnnonceController::class, 'publier']);
    Route::get    ('annonces/{id}/diffusions',[AnnonceController::class, 'diffusions']);
    Route::get    ('types-annonce',          [AnnonceController::class, 'types']);

    // -------------------------------------------------------------------------
    // Portail membre
    // -------------------------------------------------------------------------
    Route::prefix('portail')->group(function () {
        Route::get('dashboard',                  [MemberPortalController::class, 'dashboard']);
        Route::get('profil',                     [MemberPortalController::class, 'profil']);
        Route::get('cotisations/{annee}',        [MemberPortalController::class, 'cotisations']);
        Route::get('cotisations-exceptionnelles',[MemberPortalController::class, 'cotisationsExceptionnelles']);
        Route::get('prets',                      [MemberPortalController::class, 'prets']);
        Route::get('evenements',                 [MemberPortalController::class, 'evenements']);
        Route::get('annonces',                   [MemberPortalController::class, 'annonces']);
    });

    // -------------------------------------------------------------------------
    // Exports (CSV/PDF)
    // -------------------------------------------------------------------------
    Route::prefix('export')->group(function () {
        Route::get('cotisations/{annee}/csv',    [ExportController::class, 'cotisationsCSV']);
        Route::get('cotisations-exceptionnelles/csv', [ExportController::class, 'cotisationsExceptionnellesCSV']);
        Route::get('carte-membre/pdf',           [ExportController::class, 'carteMembrePDF']);
    });

    // -------------------------------------------------------------------------
    // Administration — tables de référence
    // -------------------------------------------------------------------------
    Route::get   ('admin/reference/{ref}',     [AdminController::class, 'listRef']);
    Route::post  ('admin/reference/{ref}',     [AdminController::class, 'createRef']);
    Route::put   ('admin/reference/{ref}/{id}',[AdminController::class, 'updateRef']);
    Route::delete('admin/reference/{ref}/{id}',[AdminController::class, 'deleteRef']);

    // Administration — utilisateurs
    Route::get   ('admin/users',      [AdminController::class, 'listUsers']);
    Route::get   ('admin/roles-utilisateurs', [AdminController::class, 'rolesUtilisateurs']);
    Route::post  ('admin/users',      [AdminController::class, 'createUser']);
    Route::put   ('admin/users/{id}', [AdminController::class, 'updateUser']);
    Route::delete('admin/users/{id}', [AdminController::class, 'deleteUser']);

    // -------------------------------------------------------------------------
    // Paramètres association
    // -------------------------------------------------------------------------
    Route::get ('parametres',                  [ParametreController::class, 'index']);
    Route::put ('parametres',                  [ParametreController::class, 'update']);
    Route::post('parametres/logo',             [ParametreController::class, 'uploadLogo']);
    Route::post('parametres/reglement',        [ParametreController::class, 'uploadReglement']);

    // -------------------------------------------------------------------------
    // Rapports & Dashboard
    // -------------------------------------------------------------------------
    Route::get('dashboard/kpi',                  [ReportController::class, 'kpi']);
    Route::get('rapports/pivot/{annee}',          [ReportController::class, 'pivot']);
    Route::get('rapports/recettes-depenses',      [ReportController::class, 'recettesDepenses']);
    Route::get('rapports/creances',              [ReportController::class, 'creances']);
    Route::get('rapports/contributions/{annee}', [ReportController::class, 'contributionStatus']);
    Route::get('rapports/depenses-categorie/{annee}', [ReportController::class, 'depensesParCategorie']);
    Route::get ('rapports/recap-cotisations/annees',       [ReportController::class, 'anneesDisponibles']);
    Route::get ('rapports/recap-cotisations/{annee}',      [ReportController::class, 'recapCotisations']);
    Route::post('rapports/recap-cotisations/{annee}/diffuser', [ReportController::class, 'diffuserRecap']);
});
