<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Requests\UpsertMemberRequest;

class MemberController extends Controller
{
    public function index(Request $request)
    {
        $query = DB::table('members')
            ->join('roles_membres', 'roles_membres.id', '=', 'members.role_id')
            ->select(
                'members.*',
                DB::raw("CONCAT(members.nom, ' ', members.prenom, IFNULL(CONCAT(' (', members.alias, ')'), '')) AS nom_complet"),
                'roles_membres.libelle AS role'
            );

        if ($request->filled('statut')) {
            $query->where('members.statut', $request->statut);
        }
        if ($request->filled('search')) {
            $s = '%' . $request->search . '%';
            $query->where(function ($q) use ($s) {
                $q->where('members.nom',       'LIKE', $s)
                  ->orWhere('members.prenom',  'LIKE', $s)
                  ->orWhere('members.alias',   'LIKE', $s)
                  ->orWhere('members.matricule','LIKE', $s);
            });
        }

        return response()->json($query->orderBy('members.nom')->get());
    }

    public function store(UpsertMemberRequest $request)
    {
        $data = $request->validated();

        DB::statement(
            'CALL sp_upsert_member(?,?,?,?,?,?,?,?,?,?,?,?,?,?,@o_id,@mat,@msg)',
            [
                $data['nom'],
                $data['prenom'],
                $data['alias']           ?? null,
                $data['telephone'],
                $data['telephone2']      ?? null,
                $data['email']           ?? null,
                $data['date_adhesion']   ?? null,
                $data['role_id']         ?? null,
                $data['statut']          ?? null,
                $data['lieu_habitation'] ?? null,
                $data['emploi']          ?? null,
                $data['commentaires']    ?? null,
                null,          // p_member_id NULL => INSERT
                auth()->id(),  // p_user_id
            ]
        );

        $out = DB::selectOne('SELECT @o_id AS id, @mat AS matricule, @msg AS message');

        if (! $out->id) {
            return response()->json(['message' => $out->message], 422);
        }

        return response()->json([
            'id'        => (int) $out->id,
            'matricule' => $out->matricule,
            'message'   => $out->message,
        ], 201);
    }

    public function show(int $id)
    {
        $member = DB::table('members')
            ->join('roles_membres', 'roles_membres.id', '=', 'members.role_id')
            ->select(
                'members.*',
                DB::raw("CONCAT(members.nom, ' ', members.prenom, IFNULL(CONCAT(' (', members.alias, ')'), '')) AS nom_complet"),
                'roles_membres.libelle AS role'
            )
            ->where('members.id', $id)
            ->first();

        abort_unless($member, 404, 'Membre introuvable');

        return response()->json($member);
    }

    public function update(UpsertMemberRequest $request, int $id)
    {
        $data = $request->validated();

        DB::statement(
            'CALL sp_upsert_member(?,?,?,?,?,?,?,?,?,?,?,?,?,?,@o_id,@mat,@msg)',
            [
                $data['nom'],
                $data['prenom'],
                $data['alias']           ?? null,
                $data['telephone'],
                $data['telephone2']      ?? null,
                $data['email']           ?? null,
                $data['date_adhesion']   ?? null,
                $data['role_id']         ?? null,
                $data['statut']          ?? null,
                $data['lieu_habitation'] ?? null,
                $data['emploi']          ?? null,
                $data['commentaires']    ?? null,
                $id,           // p_member_id => UPDATE
                auth()->id(),  // p_user_id
            ]
        );

        $out = DB::selectOne('SELECT @o_id AS id, @mat AS matricule, @msg AS message');

        if (! $out->id) {
            return response()->json(['message' => $out->message], 422);
        }

        return response()->json(['message' => $out->message]);
    }

    public function destroy(int $id)
    {
        // Suspension logique uniquement — pas de suppression physique
        $affected = DB::table('members')
            ->where('id', $id)
            ->whereNotExists(function ($q) use ($id) {
                $q->select(DB::raw(1))
                  ->from('contributions')
                  ->where('member_id', $id);
            })
            ->update(['statut' => 'suspendu']);

        if (! $affected) {
            return response()->json(['message' => 'Membre suspendu (données liées conservées).']);
        }

        return response()->json(['message' => 'Membre suspendu.']);
    }

    public function card(int $id)
    {
        $member = DB::table('members')
            ->join('roles_membres', 'roles_membres.id', '=', 'members.role_id')
            ->select(
                'members.id', 'members.matricule', 'members.nom', 'members.prenom',
                'members.alias', 'members.telephone', 'members.email',
                'members.date_adhesion', 'members.statut', 'members.photo_url',
                DB::raw("CONCAT(members.nom, ' ', members.prenom, IFNULL(CONCAT(' (', members.alias, ')'), '')) AS nom_complet"),
                'roles_membres.libelle AS role'
            )
            ->where('members.id', $id)
            ->first();

        abort_unless($member, 404, 'Membre introuvable');

        return response()->json($member);
    }

    public function roles()
    {
        return response()->json(
            DB::table('roles_membres')->orderBy('ordre')->get()
        );
    }
}
