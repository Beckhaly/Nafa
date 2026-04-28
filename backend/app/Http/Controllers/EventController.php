<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Requests\CreateEventRequest;

class EventController extends Controller
{
    public function index(Request $request)
    {
        $query = DB::table('events')
            ->join('types_evenement', 'types_evenement.id', '=', 'events.type_id')
            ->leftJoin('users', 'users.id', '=', 'events.created_by')
            ->select(
                'events.*',
                'types_evenement.libelle AS type',
                'users.name AS created_by_name'
            );

        if ($request->filled('statut')) {
            $query->where('events.statut', $request->statut);
        }
        if ($request->filled('type_id')) {
            $query->where('events.type_id', $request->type_id);
        }

        return response()->json($query->orderByDesc('events.date_debut')->get());
    }

    public function store(CreateEventRequest $request)
    {
        $d = $request->validated();

        $id = DB::table('events')->insertGetId([
            'type_id'     => $d['type_id'],
            'titre'       => $d['titre'],
            'description' => $d['description'] ?? null,
            'date_debut'  => $d['date_debut'],
            'date_fin'    => $d['date_fin']     ?? null,
            'lieu'        => $d['lieu']          ?? null,
            'statut'      => $d['statut']        ?? 'planifie',
            'created_by'  => $request->user()->id,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        return response()->json(['id' => $id, 'message' => 'Événement créé.'], 201);
    }

    public function show(int $id)
    {
        $event = DB::table('events')
            ->join('types_evenement', 'types_evenement.id', '=', 'events.type_id')
            ->select('events.*', 'types_evenement.libelle AS type')
            ->where('events.id', $id)
            ->first();

        abort_unless($event, 404, 'Événement introuvable');

        $event->participants = DB::table('event_participants')
            ->join('members', 'members.id', '=', 'event_participants.member_id')
            ->select(
                'event_participants.*',
                DB::raw("CONCAT(members.nom, ' ', members.prenom, IFNULL(CONCAT(' (', members.alias, ')'), '')) AS nom_complet"),
                'members.matricule'
            )
            ->where('event_participants.event_id', $id)
            ->get();

        return response()->json($event);
    }

    public function update(CreateEventRequest $request, int $id)
    {
        abort_unless(DB::table('events')->where('id', $id)->exists(), 404, 'Événement introuvable');

        DB::table('events')
            ->where('id', $id)
            ->update(array_merge($request->validated(), ['updated_at' => now()]));

        return response()->json(['message' => 'Événement mis à jour.']);
    }

    public function addParticipant(Request $request, int $id)
    {
        $request->validate([
            'member_id' => 'required|integer|exists:members,id',
            'statut'    => 'sometimes|in:inscrit,present,absent',
        ]);

        DB::table('event_participants')->insertOrIgnore([
            'event_id'   => $id,
            'member_id'  => $request->member_id,
            'statut'     => $request->statut ?? 'inscrit',
            'created_at' => now(),
        ]);

        return response()->json(['message' => 'Participant ajouté.'], 201);
    }

    public function updateParticipant(Request $request, int $id, int $mid)
    {
        $request->validate(['statut' => 'required|in:inscrit,present,absent']);

        DB::table('event_participants')
            ->where('event_id', $id)
            ->where('member_id', $mid)
            ->update(['statut' => $request->statut]);

        return response()->json(['message' => 'Statut participant mis à jour.']);
    }

    public function types()
    {
        return response()->json(DB::table('types_evenement')->get());
    }
}
