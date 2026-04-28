# Nafa — Nafa Platform

Système de gestion associative hybride (MySQL · Laravel · React).  
Spec source : `Nafa_Spec.docx` v1.0, Avril 2025.

---

## 🔧 Corrections & Améliorations Récentes

**2026-04-24** — Amélioration: KPIs et répartition dépenses par catégorie au tableau de bord
- **Changement**: Ajout de KPI "Membres" amélioré et section de répartition dépenses par catégorie; suppression des KPIs prêts
- **Modifications**:
  - Mise à jour `v_dashboard_kpi` (schema.sql):
    * Ajout colonne `total_membres` (décompte tous statuts)
  - Ajout endpoint ReportController:
    * Nouvelle méthode `depensesParCategorie($annee)` retournant dépenses groupées par catégorie, tri décroissant
    * Route: `GET /rapports/depenses-categorie/{annee}`
  - Mise à jour Dashboard.jsx:
    * Modification card "Membres": affiche actifs en valeur principale, total en sous-titre
    * Ajout nouvelle section "Répartition dépenses": liste les catégories groupées par montant dépensé (tri décroissant)
    * Suppression cartes "Prêts actifs" et "Montant prêts"
    * Appel au nouvel endpoint pour récupérer dépenses par catégorie
  - Correction SeedSchema.php: gestion proper des DELIMITER dans procédures stockées
- **Avantage**: 
  - Distinction active/total members pour clarté
  - Vue rapide des catégories à forte dépense pour suivi budgétaire et analyse
  - Dashboard plus focus sur les métriques clés: solde, recouvrement, membres, créances, dépenses par catégorie
- **Fichiers**: 01_schema.sql (v_dashboard_kpi), ReportController.php (new method), api.php (new route), Dashboard.jsx (layout refactored), SeedSchema.php (DELIMITER handling improved)

**2026-04-24** — Amélioration: Remplacement des selects par autocomplete SearchSelect
- **Changement**: Alternative aux champs select pour les données volumineuses
- **Modifications**:
  - Création nouveau composant `SearchSelect` (SearchSelect.jsx) avec:
    * Input autocomplete avec filtre en temps réel
    * Dropdown avec résultats filtrés
    * Gestion click-outside pour fermer le dropdown
    * Props configurables: options, value, onChange, displayKey, valueKey
  - Utilisation dans CreateCexForm (CotisationsPage.jsx):
    * "Événement lié" → SearchSelect avec searchable liste d'événements
    * "Annonce liée" → SearchSelect avec searchable liste d'annonces
    * "Membre" → SearchSelect avec searchable liste de membres
- **Avantage**: 
  - Meilleure UX avec beaucoup d'options (100+)
  - Recherche rapide au lieu de scroller
  - Interface cohérente et intuitive
- **Fichiers**: SearchSelect.jsx (nouveau), CotisationsPage.jsx (updated)

**2026-04-24** — Amélioration: Statistiques pour cotisations mensuelles & exceptionnelles
- **Changement**: Affichage enrichi de statistiques clés dans les deux onglets de Cotisations
- **Modifications Mensuel**:
  - Ajout fonction `computeStats()` pour calculer: total théorique, total payé, taux recouvrement
  - Ajout 5 KPI cards avec gradient colors:
    * Membres actifs (bleu) - nombre de membres dans la matrice
    * Recouvrement (vert) - % du total théorique payé
    * Total théorique (mauve) - somme cotisations attendues année
    * Total payé (amber) - somme cotisations effectivement versées
    * Reste dû (gris) - différence théorique - payé
  - Cards affichent la devise (FCFA) et formatage français pour les montants
- **Modifications Exceptionnel**:
  - Refonte des 4 stats existantes avec gradient colors et meilleur design
  - Améliorations:
    * Appels de fonds (bleu) - nombre total d'appels
    * Recouvrement (vert) - % du total dû payé
    * Total dû (mauve) - somme cotisations exceptionnelles attendues
    * Total payé (amber) - somme effectivement versées
    * Reste dû (rouge) - NOUVEAU - différence dû - payé, couleur rouge pour souligner
  - Même design et formatage que Mensuel (cohérence visuelle)
- **Avantage**: 
  - Vue rapide de la santé financière, aide à identifier les problèmes de recouvrement
  - Design cohérent entre les deux onglets
  - Meilleure lisibilité et hiérarchie visuelle avec les couleurs gradient
- **Fichier**: CotisationsPage.jsx, fonctions MensuelTab() et ExceptionnelTab()

**2026-04-24** — Ajout: Champs complémentaires pour les membres
- **Changement**: Enrichissement du profil membre avec informations supplémentaires
- **Modifications**:
  - Ajout colonne `telephone2 VARCHAR(20) NULL` à table `members` (deuxième téléphone optionnel)
  - Ajout colonne `lieu_habitation VARCHAR(255) NULL` à table `members` (adresse/lieu d'habitation)
  - Ajout colonne `emploi VARCHAR(100) NULL` à table `members` (profession/emploi)
  - Ajout colonne `commentaires TEXT NULL` à table `members` (informations complémentaires)
  - Mise à jour procédure `sp_upsert_member` : ajout 5 nouveaux paramètres (p_telephone2, p_lieu_habitation, p_emploi, p_commentaires) + inclusion dans INSERT/UPDATE
  - Mise à jour validation `UpsertMemberRequest` : ajout des 4 nouvelles règles
  - Mise à jour contrôleur `MemberController` : ajout des nouveaux champs dans les appels CALL sp_upsert_member (store + update)
  - Mise à jour formulaire `MemberForm` (MembersPage.jsx) : ajout inputs pour telephone2, lieu_habitation, emploi, commentaires, date_adhesion
  - Ajout champ date_adhesion au formulaire pour permettre de la modifier
  - Création artisan command `php artisan db:seed-schema` pour exécuter le schéma facilement
  - Création script shell `./refresh-schema.sh` pour exécuter le schéma depuis la ligne de commande
- **Avantage**: Profil membre plus complet, meilleure traçabilité des informations personnelles
- **Action**: Exécuter `php artisan db:seed-schema` pour appliquer le schéma, ou `./refresh-schema.sh`

**2026-04-24** — Amélioration: Source obligatoire pour cotisations exceptionnelles
- **Changement**: Les champs "Événement lié" et "Annonce liée" s'affichent conditionnellement selon le choix utilisateur
- **Modifications**:
  - Ajout du champ `source_type` au formulaire CreateCexForm (valeurs: 'event' | 'annonce')
  - Ajout des boutons radio pour sélectionner la source (Événement ou Annonce)
  - Affichage conditionnel: seulement le champ correspondant s'affiche selon la sélection
  - Source est maintenant OBLIGATOIRE (pas d'option "Aucune")
  - Défaut: "Événement" est pré-sélectionné
- **Avantage**: Interface plus claire et moins encombrée, user obligé de choisir

**2026-04-24** — Correction: Cotisations exceptionnelles pour annonces non enregistrées
- **Bug**: Les cotisations exceptionnelles créées avec une annonce_id n'étaient pas enregistrées
- **Cause**: La procédure stockée `sp_create_cotisation_exceptionnelle` ne prenait pas `annonce_id` en paramètre
- **Fix**:
  - Ajout paramètre `p_annonce_id` à la procédure stockée (02_procedures.sql)
  - Mise à jour des deux INSERT statements pour inclure `annonce_id`
  - Ajout de `annonce_id` dans l'audit_log
  - Mise à jour FinanceController pour passer `annonce_id` à la procédure
  - Ajout validation `annonce_id` dans CreateCotisationExceptionnelleRequest
- **Exécution**: Procédure recreée en base de données avec succès

**2026-04-24** — Correction: Budget cotisations exceptionnelles pour événements
- **Bug**: La table `events` n'avait pas la colonne `budget_cex` attendue par le frontend EventsPage.jsx
- **Fix**: 
  - Ajout colonne `budget_cex DECIMAL(15,2) NULL` à table `events` (schema.sql, ligne 330)
  - Ajout constraint `chk_events_budget_cex CHECK (budget_cex IS NULL OR budget_cex > 0)`
  - Mise à jour EventForm pour convertir budget_cex vide en NULL lors de la soumission (EventsPage.jsx, ligne 200)
- **Action**: Réexécuter `database/01_schema.sql` pour ajouter la colonne aux événements existants

**2026-04-24** — Ajout: Cotisations exceptionnelles liées aux annonces
- **Changement**: Les annonces peuvent maintenant déclencher des cotisations exceptionnelles
- **Modifications schéma**:
  - Ajout colonne `budget_cex` à table `annonces` (montant optionnel)
  - Ajout colonne `annonce_id` à table `cotisations_exceptionnelles`
  - Mise à jour vue `v_cotisations_exceptionnelles_status` pour exposer `annonce_id` et `annonce`
  - INDEX `idx_cex_annonce` et CONSTRAINT `fk_cex_annonce` ajoutés
- **Action**: Réexécuter `database/01_schema.sql` pour mettre à jour la base de données

**2026-04-24** — Correction: Appels de fonds groupés par événements
- **Bug**: La vue `v_cotisations_exceptionnelles_status` n'exposait pas `event_id`. Les appels de fonds créés avec un événement sélectionné n'apparaissaient pas.
- **Fix**: 
  - Ajout de `cex.event_id` à la vue `v_cotisations_exceptionnelles_status` (schema.sql, ligne 613)
  - Correction du titre du card pour afficher `evenement` au lieu de `libelle` (CotisationsPage.jsx, ligne 365)
- **Action**: Réexécuter `database/01_schema.sql` pour mettre à jour la vue en base de données

## Stack

| Couche | Technologie |
|--------|-------------|
| Base de données | MySQL 8.0 |
| Backend API | Laravel 11 + Sanctum |
| Frontend | React + TailwindCSS + Recharts |

## Architecture — Règle fondamentale

**Aucun calcul financier ou insertion complexe ne se fait dans Laravel.**  
Toute la logique métier est déléguée à MySQL via des procédures stockées.  
Laravel est une passerelle API légère uniquement (contrôleurs fins, pas de logique SQL inline).

## Structure du projet (cible)

```
/
├── database/
│   ├── 01_schema.sql          # L1 — Tables, index, contraintes, vues
│   └── 02_procedures.sql      # L2 — Procédures stockées
├── backend/                   # L3 — Laravel 11 API
│   └── app/Http/Controllers/
│       ├── MemberController.php
│       ├── FinanceController.php
│       ├── LoanController.php
│       ├── EventController.php
│       ├── AnnonceController.php
│       └── ReportController.php
└── frontend/                  # L4 — React SPA ✅ Généré
    ├── postcss.config.js
    ├── tailwind.config.js
    ├── vite.config.js          # proxy /api → localhost:8000
    └── src/
        ├── api/client.js       # Axios + Bearer token interceptor
        ├── context/AuthContext.jsx
        ├── main.jsx            # Routes: / /membres /cotisations /prets /prets/:id /evenements /annonces
        ├── index.css           # Tailwind + @layer components (.btn .input .card .badge)
        ├── components/
        │   ├── Layout.jsx      # Sidebar bleu, NavLink actif
        │   ├── Modal.jsx
        │   ├── Spinner.jsx
        │   ├── KpiCard.jsx
        │   └── PaymentModal.jsx
        └── pages/
            ├── Login.jsx
            ├── Dashboard.jsx   # KPI cards + BarChart + PieChart (polling 30s)
            ├── MatricePage.jsx # Pivot annuel, cellules colorées, export CSV
            ├── MembersPage.jsx # Table + search/filtre + modale create/edit
            ├── LoanList.jsx    # Cards prêts + barre progression
            ├── LoanDetail.jsx  # Tableau amortissement complet
            ├── EventsPage.jsx  # Grille événements + modale détail/participants
            └── AnnoncesPage.jsx # Liste annonces + PublishForm (canal + destinataires)
```

---

## Modèle de données complet

### Tables de référence (lookup)

| Table | Contenu | Pré-peuplée |
|-------|---------|-------------|
| `roles_membres` | Président, Vice-Président, Trésorier, Secrétaire, Membre, Auditeur | Oui |
| `roles_utilisateurs` | admin, tresorier, secretaire, lecteur | Oui |
| `categories_depenses` | Fournitures, Transport, Communication, Événements, Décaissement prêt… | Oui |
| `types_evenement` | Assemblée Générale, Réunion, Formation, Célébration… | Oui |
| `types_annonce` | Mariage, Décès, Baptême, Naissance, Anniversaire, Réunion, Autre | Oui |

---

### Couche Authentification

**`users`**
| Colonne | Type | Description |
|---------|------|-------------|
| id | BIGINT UNSIGNED PK | |
| name | VARCHAR(150) | |
| email | VARCHAR(150) UQ | |
| password | VARCHAR(255) | Hash bcrypt |
| role_id | SMALLINT UQ FK | → `roles_utilisateurs.id` |
| member_id | BIGINT NULL FK | Lien optionnel vers un membre |
| is_active | TINYINT(1) | |

**`personal_access_tokens`** — table Laravel Sanctum standard, ne pas modifier.

---

### Couche Membres

**`members`**
| Colonne | Type | Description |
|---------|------|-------------|
| id | BIGINT UNSIGNED PK | |
| matricule | VARCHAR(20) UQ | Généré par `sp_upsert_member` — format `MBR-AAAA-XXX` |
| nom | VARCHAR(100) | |
| prenom | VARCHAR(100) | |
| **alias** | VARCHAR(100) NULL | Surnom/nom usuel — affiché entre parenthèses |
| telephone | VARCHAR(20) | |
| email | VARCHAR(150) UQ NULL | |
| date_adhesion | DATE | |
| statut | ENUM | `actif` \| `inactif` \| `suspendu` |
| role_id | SMALLINT FK | → `roles_membres.id` |
| photo_url | VARCHAR(255) NULL | Chemin relatif photo carte de membre |

> **Convention `nom_complet`** — partout où le nom d'un membre est affiché (vues, procédures), utiliser le champ calculé :
> ```sql
> CONCAT(nom, ' ', prenom, IFNULL(CONCAT(' (', alias, ')'), '')) AS nom_complet
> -- Ex : "Diallo Mamadou (Petit)"  ou  "Diallo Mamadou"
> ```

---

### Couche Cotisations

**`contributions`** — cotisations mensuelles (alimentent la matrice de pointage)
| Colonne | Type | Description |
|---------|------|-------------|
| id | BIGINT UNSIGNED PK | |
| member_id | BIGINT FK | → `members.id` ON DELETE RESTRICT |
| annee | YEAR | |
| mois | TINYINT | 1–12, UNIQUE avec (member_id, annee) |
| montant_du | DECIMAL(15,2) | Cotisation théorique |
| montant_paye | DECIMAL(15,2) | Montant versé |
| statut | ENUM | `paid` \| `partial` \| `unpaid` |
| date_paiement | DATE NULL | |
| reference_recu | VARCHAR(30) UQ NULL | Format `REC-AAAA-MM-XXXXX` |

**`cotisations_exceptionnelles`** — appels de fonds ponctuels (fête, urgence, projet…)
| Colonne | Type | Description |
|---------|------|-------------|
| id | BIGINT UNSIGNED PK | |
| member_id | BIGINT FK | → `members.id` |
| event_id | BIGINT NULL FK | → `events.id` (événement déclencheur optionnel) |
| annonce_id | BIGINT NULL FK | → `annonces.id` (annonce déclencheur optionnel) |
| libelle | VARCHAR(255) | Ex : "Fête de fin d'année 2025" |
| montant_du | DECIMAL(15,2) | |
| montant_paye | DECIMAL(15,2) | |
| statut | ENUM | `paid` \| `partial` \| `unpaid` |
| date_echeance | DATE NULL | Date limite de paiement |
| reference_recu | VARCHAR(30) UQ NULL | Format `CEX-AAAA-XXXXX` |

---

### Couche Prêts

**`loans`** — statut : `actif` | `en_retard` | `solde`  
**`loan_schedule`** — tableau d'amortissement généré par `sp_generate_loan_schedule`. Statut par échéance : `pending` | `paid` | `late`.

---

### Couche Événements

**`events`** — `type_id` FK → `types_evenement`, `created_by` FK → `users`  
**`event_participants`** — statut : `inscrit` | `present` | `absent`

---

### Couche Finances

**`dons`** — `member_id` NULL si donateur externe, `event_id` NULL FK optionnel. Reçu : `DON-AAAA-XXXXX`.  
**`depenses`** — `categorie_id` FK → `categories_depenses`, `event_id` NULL FK optionnel.  
**`caisse`** — solde courant par exercice (UNIQUE sur `exercice`).  
**`caisse_mouvements`** — grand livre INSERT ONLY. `type_recette` pour les crédits (`cotisation_mensuelle` | `cotisation_exceptionnelle` | `don` | `remboursement_pret`), `categorie_id` FK pour les débits.

---

### Couche Annonces & Diffusion

**`annonces`**
| Colonne | Type | Description |
|---------|------|-------------|
| id | BIGINT UNSIGNED PK | |
| type_id | SMALLINT FK | → `types_annonce.id` |
| member_id | BIGINT NULL FK | Membre concerné (le marié, le défunt…) |
| titre | VARCHAR(200) | |
| contenu | TEXT | Corps du message SMS/WhatsApp (≤ 160 car. recommandé SMS) |
| date_evenement | DATE NULL | Date de l'événement annoncé |
| budget_cex | DECIMAL(15,2) NULL | Budget cotisation exceptionnelle (optionnel) |
| statut | ENUM | `brouillon` \| `publie` \| `archive` |
| published_at | TIMESTAMP NULL | |

**`diffusions`** — file d'envoi, 1 ligne par (annonce × membre × canal)
| Colonne | Type | Description |
|---------|------|-------------|
| annonce_id | BIGINT FK | → `annonces.id` ON DELETE CASCADE |
| member_id | BIGINT FK | Destinataire |
| canal | ENUM | `sms` \| `whatsapp` |
| telephone | VARCHAR(20) | Snapshot à la création (immuable) |
| statut | ENUM | `pending` \| `envoye` \| `echec` |
| provider_ref | VARCHAR(100) NULL | SID Twilio / ID provider |

> **Flux diffusion** :  
> `sp_publier_annonce` → crée les lignes `pending` → Job Laravel → API SMS/WhatsApp → `sp_marquer_diffusion`

---

### Couche Audit

**`audit_log`** — INSERT ONLY, jamais UPDATE ni DELETE.

---

## Procédures stockées

| Procédure | Domaine | Rôle |
|-----------|---------|------|
| `sp_upsert_member` | Membres | Insert/update, génère `MBR-AAAA-XXX`, vérifie doublons email/tél, accepte `p_alias` |
| `sp_pay_contribution` | Cotisations | Paiement mensuel → statut, reçu `REC-`, caisse, grand livre, audit |
| `sp_create_cotisation_exceptionnelle` | Cotisations | Crée un appel de fonds pour 1 membre ou tous les actifs |
| `sp_pay_cotisation_exceptionnelle` | Cotisations | Paiement exceptionnel → reçu `CEX-`, caisse, grand livre, audit |
| `sp_generate_loan_schedule` | Prêts | Crée le prêt + toutes les échéances (amortissement constant) |
| `sp_get_monthly_pivot` | Rapports | Matrice Jan–Déc, retourne `nom_complet` avec alias |
| `sp_record_don` | Finances | Don → caisse, grand livre, audit. `event_id` optionnel |
| `sp_record_depense` | Finances | Dépense → vérif solde, caisse, grand livre (`categorie_id` FK), audit |
| `sp_update_loan_statuts` | Maintenance | Marque échéances `late`, prêts `en_retard`/`solde` — cron quotidien |
| `sp_publier_annonce` | Annonces | Publie + génère file `diffusions` pending — canal `sms`/`whatsapp`/`both` |
| `sp_marquer_diffusion` | Annonces | Mise à jour statut après réponse API provider |

Toutes les procédures à écriture utilisent `START TRANSACTION … COMMIT / ROLLBACK` via `EXIT HANDLER`.

---

## Vues

| Vue | Usage |
|-----|-------|
| `v_contribution_status` | Taux de recouvrement par membre/exercice, expose `nom_complet` |
| `v_cotisations_exceptionnelles_status` | État des appels de fonds exceptionnels |
| `v_creances_en_souffrance` | Impayés (mensuels + exceptionnels) sur 3 mois glissants |
| `v_loan_summary` | Capital restant dû, progression par prêt |
| `v_dashboard_kpi` | Solde caisse, taux recouvrement mois, membres actifs, créances |
| `v_recettes_vs_depenses` | Comparatif mensuel crédit/débit — BarChart dashboard |
| `v_diffusions_stats` | Taux de succès SMS/WhatsApp par annonce |

---

## API Backend (Laravel 11)

- Auth via **Laravel Sanctum** (Bearer Token), tous les endpoints sous `auth:sanctum`.
- Réponses JSON uniquement, couverture PHPUnit > 80%.
- Les contrôleurs appellent les procédures stockées — pas de logique SQL inline.
- Pattern OUT params MySQL : `DB::statement('CALL sp_...(?,@out)', [...])` puis `DB::selectOne('SELECT @out')`.

### Contrôleurs

| Fichier | Responsabilité |
|---------|---------------|
| `Auth/AuthController` | login / logout / me |
| `MemberController` | CRUD membres, carte, rôles |
| `FinanceController` | cotisations mensuelle/exceptionnelle, dons, dépenses, caisse |
| `LoanController` | création prêt + schedule, liste, détail |
| `EventController` | CRUD événements, participants |
| `AnnonceController` | CRUD annonces, publication, suivi diffusions |
| `ReportController` | KPI dashboard, pivot, recettes/dépenses, créances |

### Routes principales

| Méthode | URI | Action |
|---------|-----|--------|
| POST | `/api/auth/login` | Login |
| GET | `/api/members` | Liste membres (filtre statut, search) |
| POST | `/api/members` | Créer membre |
| PUT | `/api/members/{id}` | Modifier membre |
| GET | `/api/members/{id}/card` | Carte de membre |
| POST | `/api/contributions/pay` | Payer cotisation mensuelle |
| POST | `/api/cotisations-exceptionnelles` | Créer appel de fonds |
| POST | `/api/cotisations-exceptionnelles/{id}/pay` | Payer cotisation exceptionnelle |
| POST | `/api/loans` | Créer prêt + schedule |
| POST | `/api/annonces/{id}/publier` | Publier + enqueue diffusions |
| GET | `/api/dashboard/kpi` | KPIs tableau de bord |
| GET | `/api/rapports/pivot/{annee}` | Matrice de pointage |

### Form Requests (validation)

`UpsertMemberRequest`, `PayContributionRequest`, `CreateCotisationExceptionnelleRequest`,
`PayCotisationExceptionnelleRequest`, `CreateLoanRequest`, `RecordDonRequest`,
`RecordDepenseRequest`, `CreateEventRequest`, `CreateAnnonceRequest`, `PublierAnnonceRequest`

### Job de diffusion

`SendDiffusionJob` — dispatché après `sp_publier_annonce`.  
Lit les `diffusions` avec statut `pending`, appelle Twilio (SMS ou WhatsApp) ou Meta Cloud API,  
puis appelle `sp_marquer_diffusion` avec le résultat.  
Provider configurable via `WHATSAPP_PROVIDER=twilio|meta` dans `.env`.

### Variables d'environnement (`.env.example`)
```
DB_DATABASE=nafa
TWILIO_SID / TWILIO_TOKEN / TWILIO_FROM
WHATSAPP_PROVIDER=twilio          # ou meta
WHATSAPP_META_TOKEN / WHATSAPP_PHONE_NUMBER_ID
QUEUE_CONNECTION=database
```

---

## Frontend React

### Pages principales
- **Dashboard** — KPIs (`v_dashboard_kpi`), graphiques Recharts, polling 30s ou WebSocket.
- **MatricePage** — Grille interactive cotisations (vert/jaune/rouge/gris), clic → PaymentModal.
- **LoanList** — Liste prêts, barre progression, badge statut.
- **MemberCard** — Carte de membre avec photo et `nom_complet` (alias entre parenthèses).
- **AnnoncePage** — Création/publication d'annonces, suivi diffusion SMS/WhatsApp.

### Codes couleur matrice
| Couleur | Statut | Condition |
|---------|--------|-----------|
| VERT | Payé | `montant_paye >= montant_du` |
| JAUNE | Partiel | `0 < montant_paye < montant_du` |
| ROUGE | Impayé | `montant_paye = 0` et date passée |
| GRIS | À venir | Mois futur |

---

## Sécurité

- `audit_log` : INSERT ONLY — aucune UPDATE ni DELETE autorisée.
- FK avec `ON DELETE RESTRICT` sur toutes les données financières.
- Contraintes CHECK sur montants (≥ 0), mois (1–12), etc.
- `sp_record_depense` vérifie le solde caisse avant débit.
- `diffusions.telephone` : snapshot immuable — ne suit pas les changements de numéro.

---

## Livrables

| # | Fichier | Statut |
|---|---------|--------|
| L1 | `database/01_schema.sql` | Généré |
| L2 | `database/02_procedures.sql` | Généré |
| L3 | `backend/` Laravel 11 API | Généré |
| L4 | `frontend/` React SPA | À faire |
