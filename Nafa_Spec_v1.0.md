# Nafa — Système de Gestion Associative

**Statut**: Document de travail  
**Version**: 1.0  
**Date**: Avril 2025

---

## 1. Contexte & Objectifs

Nafa est une plateforme numérique centralisée conçue pour transformer la gestion manuelle des associations (papier, tableurs Excel dispersés) en un système sécurisé, transparent et professionnel. Elle répond aux besoins opérationnels des ONG, tontines et associations de toute taille.

### Problème identifié
La gestion sur papier et Excel engendre des pertes d'informations, des doublons, des erreurs comptables et un manque total de transparence financière pour les membres et la direction.

### 1.1 Objectifs fonctionnels

| Objectif | Description détaillée |
|----------|----------------------|
| **Centralisation des données** | Créer une source unique de vérité pour toutes les informations des membres. Éliminer les doublons et les pertes d'information en consolidant les données dans une base MySQL structurée. |
| **Transparence financière** | Permettre un suivi rigoureux et en temps réel des flux de trésorerie : cotisations, dons, dépenses et remboursements de prêts. Renforcer la confiance entre membres et direction. |
| **Automatisation du suivi** | Identifier instantanément les retards de paiement et les créances en souffrance sans aucun calcul manuel grâce aux procédures stockées MySQL. |
| **Professionnalisation** | Produire des documents officiels de haute qualité (cartes de membres, reçus de paiement, bilans annuels) de manière instantanée et reproductible. |
| **Aide à la décision** | Fournir des indicateurs visuels sur le tableau de bord pour permettre aux dirigeants de piloter l'association avec des données réelles et actualisées. |

### Fonctionnalités principales annoncées
- Gestion des membres & Carte de membre
- Gestion des cotisations mensuelles et exceptionnelles
- Gestion des événements
- Gestion des prêts
- Gestion des rapports
- Suivi des retards de paiement & créances
- Situation de caisse
- Gestion des comptes utilisateurs
- Tableau de bord avec KPIs

---

## 2. Architecture Technique

Nafa repose sur une architecture hybride à trois niveaux :

| Couche | Technologie | Responsabilité |
|--------|-------------|-----------------|
| **Base de données** | MySQL 8.0 | Intelligence métier, Procédures stockées, Transactions ACID, Index optimisés, Audit log immuable |
| **Backend** | Laravel 11 | Passerelle API sécurisée, API RESTful, Auth. Sanctum, Gestion fichiers, Contrôleurs légers |
| **Frontend** | React + Tailwind | Interface utilisateur SPA, Dashboard réactif, Composants modulaires, Recharts / D3, Formulaires dynamiques |

### 2.1 Principe fondamental : délégation à la base de données

**Règle d'or** : Aucun calcul financier ou insertion complexe ne se fait dans le code Laravel. Toute la logique métier est déléguée à MySQL via des procédures stockées. Laravel agit exclusivement comme passerelle API.

Ce principe garantit :
- L'intégrité des données même en cas de bug applicatif
- Facilite les tests unitaires sur la couche base de données
- Permet de changer le framework backend sans réécrire la logique métier

---

## 3. Modèle de Données

### 3.1 Table `members`

| Colonne | Type | Clé | Description |
|---------|------|-----|-------------|
| id | BIGINT UNSIGNED | PK | Identifiant auto-incrémenté |
| matricule | VARCHAR(20) | UQ | Généré par `sp_upsert_member` (ex: MBR-2025-001) |
| nom | VARCHAR(100) | | Nom de famille du membre |
| prenom | VARCHAR(100) | | Prénom du membre |
| telephone | VARCHAR(20) | | Numéro de téléphone principal |
| email | VARCHAR(150) | UQ | Adresse email (nullable) |
| date_adhesion | DATE | | Date d'inscription officielle |
| statut | ENUM | | `actif` \| `inactif` \| `suspendu` |
| role | VARCHAR(50) | | Président, Trésorier, Membre... |
| created_at | TIMESTAMP | | Horodatage de création |

### 3.2 Table `contributions`

| Colonne | Type | Clé | Description |
|---------|------|-----|-------------|
| id | BIGINT UNSIGNED | PK | Identifiant |
| member_id | BIGINT UNSIGNED | FK | Référence vers members.id |
| annee | YEAR | | Exercice comptable |
| mois | TINYINT | | 1 à 12 |
| montant_du | DECIMAL(15,2) | | Cotisation mensuelle théorique |
| montant_paye | DECIMAL(15,2) | | Montant effectivement versé |
| statut | ENUM | | `paid` \| `partial` \| `unpaid` |
| date_paiement | DATE | | Date du versement |
| reference_recu | VARCHAR(30) | UQ | Numéro de reçu généré |
| created_at | TIMESTAMP | | Horodatage de l'opération |

### 3.3 Procédures stockées

| Procédure | Domaine | Objectif technique |
|-----------|---------|-------------------|
| `sp_upsert_member` | Membres | Insertion ou mise à jour sécurisée d'un membre avec génération automatique du matricule au format MBR-AAAA-XXX. Vérifie les doublons par email/téléphone avant insertion. |
| `sp_pay_contribution` | Finances | Enregistrement comptable d'un paiement de cotisation. Met à jour le statut (paid / partial), crée le reçu numérique et met à jour le solde de caisse dans la même transaction. |
| `sp_generate_loan_schedule` | Prêts | Calcul du tableau d'amortissement complet (mensualités, intérêts, capital restant). Génère toutes les lignes de remboursement prévisionnelles en une seule procédure. |
| `sp_get_monthly_pivot` | Rapports | Génération de la matrice de pointage Janvier–Décembre pour une année donnée. Retourne une ligne par membre et une colonne par mois avec le statut de cotisation. |

---

## 4. Spécifications Interface (UX/UI)

### 4.A Tableau de bord (Dashboard)

Le tableau de bord est le point d'entrée de l'application. Il doit fournir une vision synthétique et immédiate de la santé financière et opérationnelle de l'association.

#### Indicateurs KPI
- **Solde de caisse actuel** — mis à jour en temps réel après chaque transaction validée
- **Taux de recouvrement du mois** — ratio cotisations encaissées / cotisations théoriques
- **Nombre de membres actifs** — décompte des membres dont le statut est actif
- **Créances en souffrance** — total des montants impayés sur les 3 derniers mois

#### Graphiques
- **Évolution recettes vs dépenses** (Recharts BarChart) : comparaison mois par mois
- **Répartition des recettes** (Donut Chart) : cotisations, dons, remboursements
- **Courbe de tendance** du taux de recouvrement sur 12 mois glissants

### 4.B Matrice de Pointage Mensuelle

La matrice est l'outil de suivi principal des cotisations. Elle présente sous forme de grille interactive l'état de paiement de chaque membre pour chaque mois.

#### Codes couleur

| Couleur | Statut | Condition |
|---------|--------|-----------|
| VERT | Payé | `montant_paye >= montant_du` |
| JAUNE | Partiel | `0 < montant_paye < montant_du` |
| ROUGE | Impayé | `montant_paye = 0` et date passée |
| GRIS | À venir | Mois futur |

#### Interactions
- **Clic sur cellule rouge** (impayée) : ouverture du formulaire de paiement rapide
- **Clic sur cellule jaune** : affichage du détail du paiement partiel
- **Filtre par année** : rechargement de la matrice
- **Export CSV** : génération côté serveur

### 4.C Gestion des Prêts

Le module de prêts permet de gérer le cycle de vie complet d'un prêt accordé à un membre.

#### Vue liste des prêts
- Carte par prêt avec : identifiant, nom du membre, montant, taux, durée, mensualité calculée, montant restant dû
- Barre de progression du remboursement
- Badge de statut : Actif (vert), En retard (rouge), Soldé (gris)

#### Vue détail d'un prêt
- Tableau d'amortissement complet généré par `sp_generate_loan_schedule`
- Mise en évidence des échéances en retard
- Historique de tous les remboursements effectués

---

## 5. Sécurité & Intégrité des Données

### 5.1 Transactions SQL

Toutes les procédures stockées impliquant des modifications financières utilisent systématiquement des transactions SQL explicites pour garantir l'atomicité des opérations.

```sql
START TRANSACTION;
  UPDATE contributions SET montant_paye = ?, statut = ? WHERE id = ?;
  UPDATE caisse SET solde = solde + ? WHERE exercice = ?;
  INSERT INTO audit_log (action, montant, user_id, created_at) VALUES (...);
COMMIT; -- ou ROLLBACK en cas d'erreur
```

### 5.2 Contrôle d'accès

| Couche | Responsabilité | Implémentation |
|--------|-----------------|-----------------|
| **Laravel Sanctum** | Authentification par token (Bearer Token). Gestion des sessions et expiration automatique. | `Route::middleware(["auth:sanctum"])` sur tous les endpoints protégés. Tokens révocables. |
| **MySQL Rôles** | Intégrité référentielle via clés étrangères, contraintes CHECK, et unicité des données critiques. | FOREIGN KEY avec ON DELETE RESTRICT pour protéger les données liées. |
| **Audit Log** | Traçabilité immuable de chaque mouvement financier et modification de données sensibles. | Table `audit_log` en INSERT ONLY. Aucune UPDATE ou DELETE autorisée. |

---

## 6. Livrables Techniques

Le projet est découpé en 4 livrables indépendants et versionnés :

| # | Livrable | Contenu | Critères de validation |
|---|----------|---------|------------------------|
| **L1** | Script SQL Root | Tables, index, contraintes, vues. Fichier : `01_schema.sql` | Migration propre sur MySQL 8.0 vierge. Toutes les FK résolues. |
| **L2** | Script SQL Procs | Définition de toutes les procédures stockées. Fichier : `02_procedures.sql` | Tests unitaires sur données de démo. Résultats cohérents. |
| **L3** | API Laravel 11 | Contrôleurs légers, routes API, middleware Sanctum, tests PHPUnit. | Couverture de tests > 80%. Réponses JSON conformes au contrat. |
| **L4** | Application React | Composants Tailwind modulaires, pages Dashboard/Matrice/Prêts/Membres. | Rendu correct sur Chrome/Firefox/Safari. Responsive. |

---

## 7. Notes d'implémentation

Ce document constitue la référence technique du projet Nafa. Toute modification de l'architecture ou des contrats d'interface doit faire l'objet d'une mise à jour de ce cahier des charges.

**Prochain livrable proposé** : Génération du Script SQL Root (L1) incluant le schéma complet des tables et des procédures stockées, prêt à être exécuté sur un serveur MySQL 8.0.
