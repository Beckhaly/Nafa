<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    // =========================================================================
    // Config des tables de référence
    // =========================================================================

    private function ref(string $key): array
    {
        $map = [
            'roles-membres' => [
                'table'    => 'roles_membres',
                'validate' => [
                    'libelle'     => 'required|string|max:80',
                    'description' => 'nullable|string|max:255',
                    'ordre'       => 'nullable|integer|min:0',
                ],
            ],
            'categories-depenses' => [
                'table'    => 'categories_depenses',
                'validate' => [
                    'libelle' => 'required|string|max:100',
                    'icone'   => 'nullable|string|max:50',
                ],
            ],
            'types-evenement' => [
                'table'    => 'types_evenement',
                'validate' => [
                    'libelle' => 'required|string|max:100',
                ],
            ],
            'types-annonce' => [
                'table'    => 'types_annonce',
                'validate' => [
                    'libelle' => 'required|string|max:80',
                    'couleur' => 'nullable|string|max:7',
                    'icone'   => 'nullable|string|max:50',
                ],
            ],
            'roles-utilisateurs' => [
                'table'    => 'roles_utilisateurs',
                'validate' => [
                    'code'        => 'required|string|max:30',
                    'libelle'     => 'required|string|max:80',
                    'description' => 'nullable|string|max:255',
                ],
            ],

            /* ── Statuts & Énumérations ──────────────────────────────────────── */
            'statuts-membres' => [
                'table'    => 'statuts_membres',
                'validate' => [
                    'libelle'     => 'required|string|max:80',
                    'icone'       => 'nullable|string|max:50',
                    'couleur'     => 'nullable|string|max:7',
                    'description' => 'nullable|string',
                ],
            ],
            'statuts-contributions' => [
                'table'    => 'statuts_contributions',
                'validate' => [
                    'libelle'     => 'required|string|max:80',
                    'icone'       => 'nullable|string|max:50',
                    'couleur'     => 'nullable|string|max:7',
                    'description' => 'nullable|string',
                ],
            ],
            'statuts-cotisations-exceptionnelles' => [
                'table'    => 'statuts_cotisations_exceptionnelles',
                'validate' => [
                    'libelle'     => 'required|string|max:80',
                    'icone'       => 'nullable|string|max:50',
                    'couleur'     => 'nullable|string|max:7',
                    'description' => 'nullable|string',
                ],
            ],
            'statuts-loans' => [
                'table'    => 'statuts_loans',
                'validate' => [
                    'libelle'     => 'required|string|max:80',
                    'icone'       => 'nullable|string|max:50',
                    'couleur'     => 'nullable|string|max:7',
                    'description' => 'nullable|string',
                ],
            ],
            'statuts-events' => [
                'table'    => 'statuts_events',
                'validate' => [
                    'libelle'     => 'required|string|max:80',
                    'icone'       => 'nullable|string|max:50',
                    'couleur'     => 'nullable|string|max:7',
                    'description' => 'nullable|string',
                ],
            ],
            'statuts-participants' => [
                'table'    => 'statuts_participants',
                'validate' => [
                    'libelle'     => 'required|string|max:80',
                    'icone'       => 'nullable|string|max:50',
                    'couleur'     => 'nullable|string|max:7',
                    'description' => 'nullable|string',
                ],
            ],
            'canaux-diffusion' => [
                'table'    => 'canaux_diffusion',
                'validate' => [
                    'libelle'      => 'required|string|max:80',
                    'icone'        => 'nullable|string|max:50',
                    'couleur'      => 'nullable|string|max:7',
                    'api_provider' => 'nullable|string|max:50',
                    'description'  => 'nullable|string',
                ],
            ],
            'statuts-diffusions' => [
                'table'    => 'statuts_diffusions',
                'validate' => [
                    'libelle'     => 'required|string|max:80',
                    'icone'       => 'nullable|string|max:50',
                    'couleur'     => 'nullable|string|max:7',
                    'description' => 'nullable|string',
                ],
            ],
        ];

        abort_if(! isset($map[$key]), 404, 'Table de référence inconnue');
        return $map[$key];
    }

    // =========================================================================
    // CRUD générique — tables de référence
    // =========================================================================

    public function listRef(string $ref)
    {
        $cfg = $this->ref($ref);
        return response()->json(DB::table($cfg['table'])->orderBy('id')->get());
    }

    public function createRef(Request $request, string $ref)
    {
        $cfg  = $this->ref($ref);
        $data = $request->validate($cfg['validate']);

        try {
            $id = DB::table($cfg['table'])->insertGetId($data);
            return response()->json(DB::table($cfg['table'])->find($id), 201);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Ce libellé existe déjà.'], 422);
        }
    }

    public function updateRef(Request $request, string $ref, int $id)
    {
        $cfg  = $this->ref($ref);
        $data = $request->validate($cfg['validate']);

        try {
            DB::table($cfg['table'])->where('id', $id)->update($data);
            return response()->json(DB::table($cfg['table'])->find($id));
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Ce libellé existe déjà.'], 422);
        }
    }

    public function deleteRef(string $ref, int $id)
    {
        $cfg = $this->ref($ref);

        try {
            DB::table($cfg['table'])->where('id', $id)->delete();
            return response()->json(['message' => 'Supprimé avec succès.']);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Impossible de supprimer : cette valeur est utilisée ailleurs.'], 422);
        }
    }

    // =========================================================================
    // Gestion des utilisateurs
    // =========================================================================

    public function listUsers()
    {
        return response()->json(
            DB::table('users')
                ->leftJoin('roles_utilisateurs', 'roles_utilisateurs.id', '=', 'users.role_id')
                ->select('users.id', 'users.name', 'users.email', 'users.role_id',
                         'users.is_active', 'roles_utilisateurs.libelle as role')
                ->orderBy('users.id')
                ->get()
        );
    }

    public function rolesUtilisateurs()
    {
        return response()->json(DB::table('roles_utilisateurs')->orderBy('id')->get());
    }

    public function createUser(Request $request)
    {
        $data = $request->validate([
            'name'      => 'required|string|max:150',
            'email'     => 'required|email|unique:users,email',
            'password'  => 'required|string|min:8',
            'role_id'   => 'required|integer|exists:roles_utilisateurs,id',
            'is_active' => 'boolean',
        ]);

        $data['password']  = Hash::make($data['password']);
        $data['is_active'] = $data['is_active'] ?? 1;

        $id = DB::table('users')->insertGetId($data);

        return response()->json(
            DB::table('users')
                ->leftJoin('roles_utilisateurs', 'roles_utilisateurs.id', '=', 'users.role_id')
                ->select('users.*', 'roles_utilisateurs.libelle as role')
                ->where('users.id', $id)
                ->first(),
            201
        );
    }

    public function updateUser(Request $request, int $id)
    {
        $data = $request->validate([
            'name'      => 'required|string|max:150',
            'email'     => "required|email|unique:users,email,{$id}",
            'role_id'   => 'required|integer|exists:roles_utilisateurs,id',
            'is_active' => 'boolean',
            'password'  => 'nullable|string|min:8',
        ]);

        if (empty($data['password'])) {
            unset($data['password']);
        } else {
            $data['password'] = Hash::make($data['password']);
        }

        DB::table('users')->where('id', $id)->update($data);

        return response()->json(
            DB::table('users')
                ->leftJoin('roles_utilisateurs', 'roles_utilisateurs.id', '=', 'users.role_id')
                ->select('users.id', 'users.name', 'users.email', 'users.role_id',
                         'users.is_active', 'roles_utilisateurs.libelle as role')
                ->where('users.id', $id)
                ->first()
        );
    }

    public function deleteUser(int $id)
    {
        if ($id === 1) {
            return response()->json(['message' => 'Impossible de supprimer le compte administrateur principal.'], 422);
        }

        try {
            DB::table('users')->where('id', $id)->delete();
            return response()->json(['message' => 'Utilisateur supprimé.']);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Impossible de supprimer cet utilisateur.'], 422);
        }
    }

    // =========================================================================
    // Statistiques d'utilisation des références
    // =========================================================================

    public function getUsageStats(string $ref)
    {
        $stats = [];

        try {
            switch ($ref) {
                case 'statuts-membres':
                    // Count members by status (ENUM values: 'actif', 'inactif', 'suspendu')
                    $results = DB::select("SELECT statut, COUNT(*) as count FROM members GROUP BY statut");
                    foreach ($results as $row) {
                        $libelle = ucfirst($row->statut);
                        $id = DB::table('statuts_membres')->where('libelle', $libelle)->value('id');
                        if ($id) $stats[$id] = $row->count;
                    }
                    break;

                case 'statuts-contributions':
                    // Count contributions by status (ENUM values: 'paid', 'partial', 'unpaid')
                    $results = DB::select("SELECT statut, COUNT(*) as count FROM contributions GROUP BY statut");
                    foreach ($results as $row) {
                        $mapping = ['paid' => 'Payée', 'partial' => 'Partielle', 'unpaid' => 'Impayée'];
                        $libelle = $mapping[$row->statut] ?? ucfirst($row->statut);
                        $id = DB::table('statuts_contributions')->where('libelle', $libelle)->value('id');
                        if ($id) $stats[$id] = $row->count;
                    }
                    break;

                case 'statuts-cotisations-exceptionnelles':
                    $results = DB::select("SELECT statut, COUNT(*) as count FROM cotisations_exceptionnelles GROUP BY statut");
                    foreach ($results as $row) {
                        $mapping = ['paid' => 'Payée', 'partial' => 'Partielle', 'unpaid' => 'Impayée'];
                        $libelle = $mapping[$row->statut] ?? ucfirst($row->statut);
                        $id = DB::table('statuts_cotisations_exceptionnelles')->where('libelle', $libelle)->value('id');
                        if ($id) $stats[$id] = $row->count;
                    }
                    break;

                case 'statuts-loans':
                    $results = DB::select("SELECT statut, COUNT(*) as count FROM loans GROUP BY statut");
                    foreach ($results as $row) {
                        $mapping = ['actif' => 'Actif', 'en_retard' => 'En retard', 'solde' => 'Soldé'];
                        $libelle = $mapping[$row->statut] ?? ucfirst($row->statut);
                        $id = DB::table('statuts_loans')->where('libelle', $libelle)->value('id');
                        if ($id) $stats[$id] = $row->count;
                    }
                    break;

                case 'statuts-events':
                    $results = DB::select("SELECT statut, COUNT(*) as count FROM events GROUP BY statut");
                    foreach ($results as $row) {
                        $mapping = ['planifie' => 'Planifié', 'en_cours' => 'En cours', 'termine' => 'Terminé', 'annule' => 'Annulé'];
                        $libelle = $mapping[$row->statut] ?? ucfirst($row->statut);
                        $id = DB::table('statuts_events')->where('libelle', $libelle)->value('id');
                        if ($id) $stats[$id] = $row->count;
                    }
                    break;

                case 'statuts-participants':
                    $results = DB::select("SELECT statut, COUNT(*) as count FROM event_participants GROUP BY statut");
                    foreach ($results as $row) {
                        $mapping = ['inscrit' => 'Inscrit', 'present' => 'Présent', 'absent' => 'Absent'];
                        $libelle = $mapping[$row->statut] ?? ucfirst($row->statut);
                        $id = DB::table('statuts_participants')->where('libelle', $libelle)->value('id');
                        if ($id) $stats[$id] = $row->count;
                    }
                    break;

                case 'canaux-diffusion':
                    $results = DB::select("SELECT canal, COUNT(*) as count FROM diffusions GROUP BY canal");
                    foreach ($results as $row) {
                        $mapping = ['sms' => 'SMS', 'whatsapp' => 'WhatsApp'];
                        $libelle = $mapping[$row->canal] ?? ucfirst($row->canal);
                        $id = DB::table('canaux_diffusion')->where('libelle', $libelle)->value('id');
                        if ($id) $stats[$id] = $row->count;
                    }
                    break;

                case 'statuts-diffusions':
                    $results = DB::select("SELECT statut, COUNT(*) as count FROM diffusions GROUP BY statut");
                    foreach ($results as $row) {
                        $mapping = ['pending' => 'En attente', 'envoye' => 'Envoyé', 'echec' => 'Échec'];
                        $libelle = $mapping[$row->statut] ?? ucfirst($row->statut);
                        $id = DB::table('statuts_diffusions')->where('libelle', $libelle)->value('id');
                        if ($id) $stats[$id] = $row->count;
                    }
                    break;
            }
        } catch (\Throwable $e) {
            // Silently fail if tables don't exist yet
        }

        return response()->json($stats);
    }
}
