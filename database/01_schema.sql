-- =============================================================================
-- Nafa — L1 Schema Root
-- MySQL 8.0 | Run on a clean database
-- =============================================================================

SET NAMES utf8mb4;
SET foreign_key_checks = 0;

-- =============================================================================
-- TABLES DE RÉFÉRENCE (lookup)
-- Créées en premier — aucune dépendance externe
-- =============================================================================

-- -----------------------------------------------------------------------------
-- roles_membres  — rôles au sein de l'association
-- Ex : Président, Vice-Président, Trésorier, Secrétaire, Membre, Auditeur
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles_membres (
    id          SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    libelle     VARCHAR(80)       NOT NULL,
    description VARCHAR(255)      NULL,
    ordre       TINYINT UNSIGNED  NOT NULL DEFAULT 99 COMMENT 'Ordre affichage',

    PRIMARY KEY (id),
    UNIQUE KEY uq_roles_membres_libelle (libelle)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO roles_membres (libelle, ordre) VALUES
    ('Président',       1),
    ('Vice-Président',  2),
    ('Trésorier',       3),
    ('Secrétaire',      4),
    ('Membre',          5),
    ('Auditeur',        6)
ON DUPLICATE KEY UPDATE ordre = VALUES(ordre);

-- -----------------------------------------------------------------------------
-- roles_utilisateurs  — droits d'accès système
-- Ex : admin, trésorier, secrétaire, lecteur
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles_utilisateurs (
    id          SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    code        VARCHAR(30)       NOT NULL COMMENT 'Clé utilisée dans le code (snake_case)',
    libelle     VARCHAR(80)       NOT NULL,
    description VARCHAR(255)      NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_roles_util_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO roles_utilisateurs (code, libelle, description) VALUES
    ('admin',       'Administrateur',  'Accès complet — paramétrage, suppression, export'),
    ('tresorier',   'Trésorier',       'Saisie et validation des opérations financières'),
    ('secretaire',  'Secrétaire',      'Gestion des membres et des événements'),
    ('lecteur',     'Lecteur',         'Consultation uniquement — aucune modification'),
    ('membre',      'Membre',          'Portail membre — accès à ses propres données uniquement')
ON DUPLICATE KEY UPDATE libelle = VALUES(libelle);

-- -----------------------------------------------------------------------------
-- categories_depenses  — nature des dépenses
-- Ex : Fournitures, Transport, Communication, Événements, Prêt (décaissement)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories_depenses (
    id      SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    libelle VARCHAR(100)      NOT NULL,
    icone   VARCHAR(50)       NULL COMMENT 'Nom icone front-end optionnel',

    PRIMARY KEY (id),
    UNIQUE KEY uq_cat_depenses_libelle (libelle)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO categories_depenses (libelle) VALUES
    ('Fournitures de bureau'),
    ('Transport et déplacement'),
    ('Communication'),
    ('Événements et cérémonies'),
    ('Décaissement prêt'),
    ('Charges fixes'),
    ('Autre')
ON DUPLICATE KEY UPDATE libelle = VALUES(libelle);

-- -----------------------------------------------------------------------------
-- types_evenement  — catégories d'événements
-- Ex : Assemblée Générale, Réunion, Formation, Célébration
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS types_evenement (
    id      SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    libelle VARCHAR(100)      NOT NULL,

    PRIMARY KEY (id),
    UNIQUE KEY uq_types_evt_libelle (libelle)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO types_evenement (libelle) VALUES
    ('Assemblée Générale'),
    ('Réunion ordinaire'),
    ('Formation'),
    ('Célébration'),
    ('Activité caritative'),
    ('Autre')
ON DUPLICATE KEY UPDATE libelle = VALUES(libelle);


-- =============================================================================
-- COUCHE AUTHENTIFICATION
-- =============================================================================

-- -----------------------------------------------------------------------------
-- users  (comptes applicatifs Laravel Sanctum)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id          BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
    name        VARCHAR(150)      NOT NULL,
    email       VARCHAR(150)      NOT NULL,
    password    VARCHAR(255)      NOT NULL,
    role_id     SMALLINT UNSIGNED NOT NULL DEFAULT 4 COMMENT 'FK → roles_utilisateurs.id',
    member_id   BIGINT UNSIGNED   NULL     COMMENT 'Lien optionnel vers un membre',
    is_active   TINYINT(1)        NOT NULL DEFAULT 1,
    created_at  TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email  (email),
    INDEX       idx_users_role (role_id),

    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id) REFERENCES roles_utilisateurs(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- personal_access_tokens  (Laravel Sanctum — ne pas modifier)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS personal_access_tokens (
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    tokenable_type VARCHAR(255)    NOT NULL,
    tokenable_id   BIGINT UNSIGNED NOT NULL,
    name           VARCHAR(255)    NOT NULL,
    token          VARCHAR(64)     NOT NULL,
    abilities      TEXT            NULL,
    last_used_at   TIMESTAMP       NULL,
    expires_at     TIMESTAMP       NULL,
    created_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_token    (token),
    INDEX      idx_tokenable (tokenable_type, tokenable_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- COUCHE MEMBRES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- members
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS members (
    id              BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
    matricule       VARCHAR(20)       NOT NULL,
    nom             VARCHAR(100)      NOT NULL,
    prenom          VARCHAR(100)      NOT NULL,
    telephone       VARCHAR(20)       NOT NULL,
    telephone2      VARCHAR(20)       NULL COMMENT 'Deuxième numéro de téléphone (optionnel)',
    email           VARCHAR(150)      NULL,
    date_adhesion   DATE              NOT NULL,
    statut          ENUM('actif','inactif','suspendu') NOT NULL DEFAULT 'actif',
    alias           VARCHAR(100)      NULL COMMENT 'Surnom ou nom usuel — affiché entre parenthèses',
    role_id         SMALLINT UNSIGNED NOT NULL DEFAULT 5 COMMENT 'FK → roles_membres.id',
    photo_url       VARCHAR(255)      NULL COMMENT 'Chemin relatif — photo carte de membre',
    lieu_habitation VARCHAR(255)      NULL COMMENT 'Lieu d''habitation / adresse',
    emploi          VARCHAR(100)      NULL COMMENT 'Profession / emploi',
    commentaires    TEXT              NULL COMMENT 'Informations complémentaires',
    created_at      TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_members_matricule (matricule),
    UNIQUE KEY uq_members_email     (email),
    INDEX       idx_members_statut  (statut),
    INDEX       idx_members_nom     (nom, prenom),

    CONSTRAINT fk_members_role
        FOREIGN KEY (role_id) REFERENCES roles_membres(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- COUCHE COTISATIONS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- contributions  (cotisations mensuelles — alimentent la matrice de pointage)
-- Contrainte uq : un seul enregistrement par membre / année / mois
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contributions (
    id              BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
    member_id       BIGINT UNSIGNED  NOT NULL,
    annee           YEAR             NOT NULL,
    mois            TINYINT UNSIGNED NOT NULL,
    montant_du      DECIMAL(15,2)    NOT NULL,
    montant_paye    DECIMAL(15,2)    NOT NULL DEFAULT 0.00,
    statut          ENUM('paid','partial','unpaid') NOT NULL DEFAULT 'unpaid',
    date_paiement   DATE             NULL,
    reference_recu  VARCHAR(30)      NULL,
    created_at      TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_contributions_periode (member_id, annee, mois),
    UNIQUE KEY uq_contributions_recu    (reference_recu),
    INDEX      idx_contributions_statut (statut),
    INDEX      idx_contributions_annee  (annee, mois),

    CONSTRAINT fk_contributions_member
        FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE RESTRICT,

    CONSTRAINT chk_contributions_mois        CHECK (mois BETWEEN 1 AND 12),
    CONSTRAINT chk_contributions_montant_du  CHECK (montant_du  >= 0),
    CONSTRAINT chk_contributions_montant_paye CHECK (montant_paye >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- cotisations_exceptionnelles
-- Appels de fonds ponctuels : fête de fin d'année, achat matériel,
-- cotisation d'urgence, etc. Peuvent être liées à un événement.
-- Pas de contrainte annee/mois — date_echeance libre.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cotisations_exceptionnelles (
    id              BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
    member_id       BIGINT UNSIGNED  NOT NULL,
    event_id        BIGINT UNSIGNED  NULL     COMMENT 'Événement déclencheur (optionnel)',
    annonce_id      BIGINT UNSIGNED  NULL     COMMENT 'Annonce déclencheur (optionnel)',
    libelle         VARCHAR(255)     NOT NULL COMMENT 'Ex: Fete de fin annee 2025',
    montant_du      DECIMAL(15,2)    NOT NULL,
    montant_paye    DECIMAL(15,2)    NOT NULL DEFAULT 0.00,
    statut          ENUM('paid','partial','unpaid') NOT NULL DEFAULT 'unpaid',
    date_echeance   DATE             NULL     COMMENT 'Date limite de paiement',
    date_paiement   DATE             NULL,
    reference_recu  VARCHAR(30)      NULL,
    created_by      BIGINT UNSIGNED  NULL,
    created_at      TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_cex_recu   (reference_recu),
    INDEX      idx_cex_member (member_id),
    INDEX      idx_cex_event  (event_id),
    INDEX      idx_cex_annonce (annonce_id),
    INDEX      idx_cex_statut (statut),
    INDEX      idx_cex_echeance (date_echeance),

    CONSTRAINT fk_cex_member  FOREIGN KEY (member_id)  REFERENCES members(id)   ON DELETE RESTRICT,
    CONSTRAINT fk_cex_event   FOREIGN KEY (event_id)   REFERENCES events(id)    ON DELETE SET NULL,
    CONSTRAINT fk_cex_annonce FOREIGN KEY (annonce_id) REFERENCES annonces(id)  ON DELETE SET NULL,
    CONSTRAINT fk_cex_user    FOREIGN KEY (created_by) REFERENCES users(id)     ON DELETE SET NULL,

    CONSTRAINT chk_cex_montant_du    CHECK (montant_du   > 0),
    CONSTRAINT chk_cex_montant_paye  CHECK (montant_paye >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- COUCHE PRÊTS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- loans
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS loans (
    id            BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
    member_id     BIGINT UNSIGNED  NOT NULL,
    montant       DECIMAL(15,2)    NOT NULL,
    taux_interet  DECIMAL(5,2)     NOT NULL COMMENT 'Taux annuel en %',
    duree_mois    TINYINT UNSIGNED NOT NULL,
    mensualite    DECIMAL(15,2)    NOT NULL,
    date_debut    DATE             NOT NULL,
    statut        ENUM('actif','en_retard','solde') NOT NULL DEFAULT 'actif',
    created_at    TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_loans_member (member_id),
    INDEX idx_loans_statut (statut),

    CONSTRAINT fk_loans_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE RESTRICT,

    CONSTRAINT chk_loans_montant  CHECK (montant > 0),
    CONSTRAINT chk_loans_taux     CHECK (taux_interet >= 0),
    CONSTRAINT chk_loans_duree    CHECK (duree_mois > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- loan_schedule  (tableau d'amortissement)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS loan_schedule (
    id               BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
    loan_id          BIGINT UNSIGNED  NOT NULL,
    numero_echeance  TINYINT UNSIGNED NOT NULL,
    date_echeance    DATE             NOT NULL,
    montant_echeance DECIMAL(15,2)    NOT NULL,
    capital          DECIMAL(15,2)    NOT NULL,
    interets         DECIMAL(15,2)    NOT NULL,
    capital_restant  DECIMAL(15,2)    NOT NULL,
    montant_paye     DECIMAL(15,2)    NOT NULL DEFAULT 0.00,
    statut           ENUM('pending','paid','late') NOT NULL DEFAULT 'pending',
    date_paiement    DATE             NULL,
    created_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_schedule_echeance (loan_id, numero_echeance),
    INDEX      idx_schedule_statut  (statut),
    INDEX      idx_schedule_date    (date_echeance),

    CONSTRAINT fk_schedule_loan FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE RESTRICT,

    CONSTRAINT chk_schedule_montant_paye CHECK (montant_paye >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- COUCHE ÉVÉNEMENTS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- events
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
    id           BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
    type_id      SMALLINT UNSIGNED NOT NULL COMMENT 'FK → types_evenement.id',
    titre        VARCHAR(200)      NOT NULL,
    description  TEXT              NULL,
    date_debut   DATETIME          NOT NULL,
    date_fin     DATETIME          NULL,
    lieu         VARCHAR(200)      NULL,
    budget_cex   DECIMAL(15,2)     NULL     COMMENT 'Budget cotisation exceptionnelle (optionnel)',
    statut       ENUM('planifie','en_cours','termine','annule') NOT NULL DEFAULT 'planifie',
    created_by   BIGINT UNSIGNED   NULL,
    created_at   TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_events_type   (type_id),
    INDEX idx_events_statut (statut),
    INDEX idx_events_date   (date_debut),

    CONSTRAINT fk_events_type FOREIGN KEY (type_id)    REFERENCES types_evenement(id) ON DELETE RESTRICT,
    CONSTRAINT fk_events_user FOREIGN KEY (created_by) REFERENCES users(id)           ON DELETE SET NULL,
    CONSTRAINT chk_events_budget_cex CHECK (budget_cex IS NULL OR budget_cex > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- event_participants
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_participants (
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    event_id   BIGINT UNSIGNED NOT NULL,
    member_id  BIGINT UNSIGNED NOT NULL,
    statut     ENUM('inscrit','present','absent') NOT NULL DEFAULT 'inscrit',
    created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_event_member (event_id, member_id),
    INDEX      idx_ep_member   (member_id),

    CONSTRAINT fk_ep_event  FOREIGN KEY (event_id)  REFERENCES events(id)  ON DELETE CASCADE,
    CONSTRAINT fk_ep_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- COUCHE FINANCES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- dons  (recettes hors cotisations)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dons (
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    member_id      BIGINT UNSIGNED NULL  COMMENT 'NULL si donateur externe',
    event_id       BIGINT UNSIGNED NULL  COMMENT 'Événement bénéficiaire (optionnel)',
    donateur_nom   VARCHAR(150)    NULL  COMMENT 'Nom si donateur externe',
    montant        DECIMAL(15,2)   NOT NULL,
    date_don       DATE            NOT NULL,
    motif          VARCHAR(255)    NULL,
    reference_recu VARCHAR(30)     NULL,
    created_by     BIGINT UNSIGNED NULL,
    created_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_dons_recu    (reference_recu),
    INDEX      idx_dons_date   (date_don),
    INDEX      idx_dons_member (member_id),
    INDEX      idx_dons_event  (event_id),

    CONSTRAINT fk_dons_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL,
    CONSTRAINT fk_dons_event  FOREIGN KEY (event_id)  REFERENCES events(id)  ON DELETE SET NULL,
    CONSTRAINT fk_dons_user   FOREIGN KEY (created_by) REFERENCES users(id)  ON DELETE SET NULL,

    CONSTRAINT chk_dons_montant CHECK (montant > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- depenses
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS depenses (
    id               BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
    categorie_id     SMALLINT UNSIGNED NOT NULL COMMENT 'FK → categories_depenses.id',
    event_id         BIGINT UNSIGNED   NULL     COMMENT 'Événement associé (optionnel)',
    libelle          VARCHAR(255)      NOT NULL,
    montant          DECIMAL(15,2)     NOT NULL,
    date_depense     DATE              NOT NULL,
    beneficiaire     VARCHAR(150)      NULL,
    reference_piece  VARCHAR(50)       NULL,
    created_by       BIGINT UNSIGNED   NULL,
    created_at       TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_depenses_categorie (categorie_id),
    INDEX idx_depenses_event     (event_id),
    INDEX idx_depenses_date      (date_depense),

    CONSTRAINT fk_depenses_categorie FOREIGN KEY (categorie_id) REFERENCES categories_depenses(id) ON DELETE RESTRICT,
    CONSTRAINT fk_depenses_event     FOREIGN KEY (event_id)     REFERENCES events(id)              ON DELETE SET NULL,
    CONSTRAINT fk_depenses_user      FOREIGN KEY (created_by)   REFERENCES users(id)               ON DELETE SET NULL,

    CONSTRAINT chk_depenses_montant CHECK (montant > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- caisse  (solde courant par exercice)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS caisse (
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    exercice   YEAR            NOT NULL,
    solde      DECIMAL(15,2)   NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_caisse_exercice (exercice)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- caisse_mouvements  (grand livre — INSERT ONLY)
-- categorie_id → categories_depenses pour les débits ;
-- NULL pour les crédits (cotisation, don, remboursement)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS caisse_mouvements (
    id            BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
    exercice      YEAR              NOT NULL,
    type          ENUM('credit','debit') NOT NULL,
    type_recette  ENUM('cotisation_mensuelle','cotisation_exceptionnelle','don','remboursement_pret','adhesion','autre') NULL
                  COMMENT 'Renseigné si type = credit',
    categorie_id  SMALLINT UNSIGNED NULL
                  COMMENT 'FK → categories_depenses — renseigné si type = debit',
    montant       DECIMAL(15,2)     NOT NULL,
    solde_apres   DECIMAL(15,2)     NOT NULL,
    reference_id  BIGINT UNSIGNED   NULL COMMENT 'ID dans la table source',
    libelle       VARCHAR(255)      NULL,
    created_by    BIGINT UNSIGNED   NULL,
    created_at    TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_mouvements_exercice    (exercice),
    INDEX idx_mouvements_type        (type),
    INDEX idx_mouvements_type_recette(type_recette),
    INDEX idx_mouvements_categorie   (categorie_id),
    INDEX idx_mouvements_date        (created_at),

    CONSTRAINT fk_mouvements_categorie
        FOREIGN KEY (categorie_id) REFERENCES categories_depenses(id) ON DELETE RESTRICT,

    CONSTRAINT chk_mouvement_montant CHECK (montant > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- COUCHE ANNONCES & DIFFUSION
-- =============================================================================

-- -----------------------------------------------------------------------------
-- types_annonce  — catégories d'annonces
-- Ex : Mariage, Décès, Baptême, Naissance, Anniversaire, Réunion, Autre
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS types_annonce (
    id      SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    libelle VARCHAR(80)       NOT NULL,
    icone   VARCHAR(50)       NULL  COMMENT 'Nom icône front-end',
    couleur VARCHAR(7)        NULL  COMMENT 'Code hex ex : #E74C3C',

    PRIMARY KEY (id),
    UNIQUE KEY uq_types_annonce_libelle (libelle)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO types_annonce (libelle, couleur) VALUES
    ('Mariage',     '#E91E8C'),
    ('Décès',       '#607D8B'),
    ('Baptême',     '#2196F3'),
    ('Naissance',   '#4CAF50'),
    ('Anniversaire','#FF9800'),
    ('Réunion',     '#9C27B0'),
    ('Autre',       '#757575')
ON DUPLICATE KEY UPDATE couleur = VALUES(couleur);

-- -----------------------------------------------------------------------------
-- annonces
-- Une annonce = un message à diffuser aux membres.
-- member_id : membre concerné par l'annonce (le marié, le défunt, etc.).
-- contenu   : texte brut envoyé par SMS / WhatsApp (≤ 160 car. recommandé SMS).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS annonces (
    id             BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
    type_id        SMALLINT UNSIGNED NOT NULL COMMENT 'FK → types_annonce.id',
    member_id      BIGINT UNSIGNED   NULL     COMMENT 'Membre concerné (optionnel)',
    titre          VARCHAR(200)      NOT NULL,
    contenu        TEXT              NOT NULL COMMENT 'Corps du message SMS/WhatsApp',
    date_evenement DATE              NULL     COMMENT 'Date evenement annonce',
    budget_cex     DECIMAL(15,2)     NULL     COMMENT 'Budget cotisation exceptionnelle (optionnel)',
    statut         ENUM('brouillon','publie','archive') NOT NULL DEFAULT 'brouillon',
    created_by     BIGINT UNSIGNED   NULL,
    published_at   TIMESTAMP         NULL,
    created_at     TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_annonces_type    (type_id),
    INDEX idx_annonces_member  (member_id),
    INDEX idx_annonces_statut  (statut),
    INDEX idx_annonces_date    (date_evenement),

    CONSTRAINT fk_annonces_type   FOREIGN KEY (type_id)   REFERENCES types_annonce(id) ON DELETE RESTRICT,
    CONSTRAINT fk_annonces_member FOREIGN KEY (member_id) REFERENCES members(id)       ON DELETE SET NULL,
    CONSTRAINT fk_annonces_user   FOREIGN KEY (created_by) REFERENCES users(id)        ON DELETE SET NULL,
    CONSTRAINT chk_annonces_budget_cex CHECK (budget_cex IS NULL OR budget_cex > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- diffusions
-- File de diffusion : une ligne par (annonce × membre × canal).
-- Le téléphone est copié au moment de la création (snapshot immuable).
-- Laravel lit les lignes 'pending' et appelle l'API SMS/WhatsApp.
-- provider_ref : SID Twilio ou identifiant retourné par le provider.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS diffusions (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    annonce_id   BIGINT UNSIGNED NOT NULL,
    member_id    BIGINT UNSIGNED NOT NULL,
    canal        ENUM('sms','whatsapp') NOT NULL,
    telephone    VARCHAR(20)     NOT NULL COMMENT 'Snapshot numero envoi',
    statut       ENUM('pending','envoye','echec') NOT NULL DEFAULT 'pending',
    provider_ref VARCHAR(100)    NULL COMMENT 'ID retourné par Twilio / provider',
    sent_at      TIMESTAMP       NULL,
    error_msg    VARCHAR(500)    NULL,
    created_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_diffusion (annonce_id, member_id, canal),
    INDEX idx_diffusions_statut    (statut),
    INDEX idx_diffusions_annonce   (annonce_id),
    INDEX idx_diffusions_member    (member_id),
    INDEX idx_diffusions_canal     (canal),

    CONSTRAINT fk_diffusions_annonce FOREIGN KEY (annonce_id) REFERENCES annonces(id) ON DELETE CASCADE,
    CONSTRAINT fk_diffusions_member  FOREIGN KEY (member_id)  REFERENCES members(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- COUCHE AUDIT
-- =============================================================================

-- -----------------------------------------------------------------------------
-- audit_log  (INSERT ONLY — jamais UPDATE ni DELETE)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    action     VARCHAR(100)    NOT NULL,
    table_name VARCHAR(50)     NULL,
    record_id  BIGINT UNSIGNED NULL,
    montant    DECIMAL(15,2)   NULL,
    user_id    BIGINT UNSIGNED NULL,
    details    JSON            NULL,
    created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_audit_action     (action),
    INDEX idx_audit_table      (table_name, record_id),
    INDEX idx_audit_created_at (created_at),
    INDEX idx_audit_user       (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- VUES
-- =============================================================================

-- v_contribution_status — taux de recouvrement mensuel par membre / exercice
CREATE OR REPLACE VIEW v_contribution_status AS
SELECT
    m.id                                                      AS member_id,
    m.matricule, m.nom, m.prenom, m.alias,
    CONCAT(m.nom, ' ', m.prenom, IFNULL(CONCAT(' (', m.alias, ')'), '')) AS nom_complet,
    rm.libelle                                                AS role,
    c.annee,
    COUNT(c.id)                                               AS total_mois,
    SUM(c.statut = 'paid')                                    AS mois_payes,
    SUM(c.statut = 'partial')                                 AS mois_partiels,
    SUM(c.statut = 'unpaid')                                  AS mois_impayes,
    SUM(c.montant_du)                                         AS total_du,
    SUM(c.montant_paye)                                       AS total_paye,
    SUM(c.montant_du) - SUM(c.montant_paye)                  AS solde_restant,
    ROUND(SUM(c.montant_paye) / NULLIF(SUM(c.montant_du),0) * 100, 2) AS taux_recouvrement
FROM members m
JOIN roles_membres rm ON rm.id = m.role_id
JOIN contributions c  ON c.member_id = m.id
GROUP BY m.id, m.matricule, m.nom, m.prenom, m.alias, rm.libelle, c.annee;

-- v_cotisations_exceptionnelles_status — état des appels de fonds exceptionnels
CREATE OR REPLACE VIEW v_cotisations_exceptionnelles_status AS
SELECT
    cex.id,
    m.matricule, m.nom, m.prenom, m.alias,
    CONCAT(m.nom, ' ', m.prenom, IFNULL(CONCAT(' (', m.alias, ')'), '')) AS nom_complet,
    cex.libelle,
    cex.event_id,
    e.titre                                                   AS evenement,
    cex.annonce_id,
    a.titre                                                   AS annonce,
    cex.montant_du, cex.montant_paye,
    cex.montant_du - cex.montant_paye                        AS solde_restant,
    cex.statut, cex.date_echeance, cex.date_paiement,
    cex.reference_recu
FROM cotisations_exceptionnelles cex
JOIN members m          ON m.id  = cex.member_id
LEFT JOIN events e      ON e.id  = cex.event_id
LEFT JOIN annonces a    ON a.id  = cex.annonce_id;

-- v_creances_en_souffrance — impayés (mensuels + exceptionnels) 3 derniers mois
CREATE OR REPLACE VIEW v_creances_en_souffrance AS
SELECT
    m.id AS member_id, m.matricule, m.nom, m.prenom, m.alias,
    CONCAT(m.nom, ' ', m.prenom, IFNULL(CONCAT(' (', m.alias, ')'), '')) AS nom_complet,
    'mensuelle'   AS type_cotisation,
    c.annee, c.mois,
    NULL          AS libelle,
    c.montant_du, c.montant_paye,
    c.montant_du - c.montant_paye AS montant_en_souffrance,
    NULL          AS date_echeance
FROM contributions c
JOIN members m ON m.id = c.member_id
WHERE c.statut IN ('unpaid','partial')
  AND STR_TO_DATE(CONCAT(c.annee,'-',LPAD(c.mois,2,'0'),'-01'),'%Y-%m-%d')
      >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 3 MONTH),'%Y-%m-01')
  AND STR_TO_DATE(CONCAT(c.annee,'-',LPAD(c.mois,2,'0'),'-01'),'%Y-%m-%d')
      < DATE_FORMAT(CURDATE(),'%Y-%m-01')

UNION ALL

SELECT
    m.id, m.matricule, m.nom, m.prenom, m.alias,
    CONCAT(m.nom, ' ', m.prenom, IFNULL(CONCAT(' (', m.alias, ')'), '')) AS nom_complet,
    'exceptionnelle',
    YEAR(cex.date_echeance), MONTH(cex.date_echeance),
    cex.libelle,
    cex.montant_du, cex.montant_paye,
    cex.montant_du - cex.montant_paye,
    cex.date_echeance
FROM cotisations_exceptionnelles cex
JOIN members m ON m.id = cex.member_id
WHERE cex.statut IN ('unpaid','partial')
  AND (cex.date_echeance IS NULL OR cex.date_echeance < CURDATE());

-- v_loan_summary — état de chaque prêt avec capital restant dû
CREATE OR REPLACE VIEW v_loan_summary AS
SELECT
    l.id AS loan_id, l.member_id,
    m.matricule, m.nom, m.prenom, m.alias,
    CONCAT(m.nom, ' ', m.prenom, IFNULL(CONCAT(' (', m.alias, ')'), '')) AS nom_complet,
    l.montant AS montant_initial,
    l.taux_interet, l.duree_mois, l.mensualite, l.date_debut, l.statut,
    COUNT(ls.id)                                                       AS total_echeances,
    SUM(ls.statut = 'paid')                                            AS echeances_payees,
    SUM(ls.montant_echeance)                                           AS total_a_rembourser,
    SUM(ls.montant_paye)                                               AS total_rembourse,
    SUM(CASE WHEN ls.statut != 'paid' THEN ls.capital_restant ELSE 0 END) AS capital_restant_du
FROM loans l
JOIN members m        ON m.id = l.member_id
LEFT JOIN loan_schedule ls ON ls.loan_id = l.id
GROUP BY l.id, l.member_id, m.matricule, m.nom, m.prenom, m.alias,
         l.montant, l.taux_interet, l.duree_mois, l.mensualite, l.date_debut, l.statut;

-- v_dashboard_kpi — indicateurs tableau de bord (exercice courant)
CREATE OR REPLACE VIEW v_dashboard_kpi AS
SELECT
    (SELECT COALESCE(solde, 0) FROM caisse WHERE exercice = YEAR(CURDATE()))
        AS solde_caisse,

    (SELECT ROUND(SUM(montant_paye) / NULLIF(SUM(montant_du),0) * 100, 2)
     FROM contributions
     WHERE annee = YEAR(CURDATE()) AND mois = MONTH(CURDATE()))
        AS taux_recouvrement_mois,

    (SELECT COUNT(*) FROM members WHERE statut = 'actif')
        AS membres_actifs,

    (SELECT COUNT(*) FROM members)
        AS total_membres,

    -- Créances : mensuelles + exceptionnelles
    (
        SELECT COALESCE(SUM(montant_du - montant_paye), 0)
        FROM contributions
        WHERE statut IN ('unpaid','partial')
          AND STR_TO_DATE(CONCAT(annee,'-',LPAD(mois,2,'0'),'-01'),'%Y-%m-%d')
              >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 3 MONTH),'%Y-%m-01')
          AND STR_TO_DATE(CONCAT(annee,'-',LPAD(mois,2,'0'),'-01'),'%Y-%m-%d')
              < DATE_FORMAT(CURDATE(),'%Y-%m-01')
    ) + (
        SELECT COALESCE(SUM(montant_du - montant_paye), 0)
        FROM cotisations_exceptionnelles
        WHERE statut IN ('unpaid','partial')
          AND (date_echeance IS NULL OR date_echeance < CURDATE())
    )   AS creances_en_souffrance,

    (SELECT COUNT(*) FROM loans WHERE statut = 'actif')
        AS nb_prets_actifs,

    (SELECT COALESCE(SUM(capital_restant_du), 0) FROM v_loan_summary WHERE statut IN ('actif','en_retard'))
        AS montant_prets_en_cours;

-- v_recettes_vs_depenses — BarChart dashboard (exercice courant)
CREATE OR REPLACE VIEW v_recettes_vs_depenses AS
SELECT
    YEAR(CURDATE()) AS annee,
    n.mois_num      AS mois,
    COALESCE(r.recettes, 0) AS recettes,
    COALESCE(d.charges,  0) AS depenses
FROM (
    SELECT 1 AS mois_num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
    UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8
    UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12
) n
LEFT JOIN (
    SELECT MONTH(created_at) AS m, SUM(montant) AS recettes
    FROM caisse_mouvements
    WHERE type = 'credit' AND exercice = YEAR(CURDATE())
    GROUP BY MONTH(created_at)
) r ON r.m = n.mois_num
LEFT JOIN (
    SELECT MONTH(date_depense) AS m, SUM(montant) AS charges
    FROM depenses
    WHERE YEAR(date_depense) = YEAR(CURDATE())
    GROUP BY MONTH(date_depense)
) d ON d.m = n.mois_num;

-- v_diffusions_stats — état d'avancement de chaque campagne de diffusion
CREATE OR REPLACE VIEW v_diffusions_stats AS
SELECT
    a.id            AS annonce_id,
    ta.libelle      AS type_annonce,
    a.titre,
    a.statut        AS statut_annonce,
    a.published_at,
    COUNT(d.id)                          AS total_destinataires,
    SUM(d.statut = 'envoye')             AS envoyes,
    SUM(d.statut = 'echec')              AS echecs,
    SUM(d.statut = 'pending')            AS en_attente,
    SUM(d.canal   = 'sms')               AS via_sms,
    SUM(d.canal   = 'whatsapp')          AS via_whatsapp,
    ROUND(SUM(d.statut = 'envoye') / NULLIF(COUNT(d.id), 0) * 100, 1) AS taux_succes
FROM annonces a
JOIN types_annonce ta ON ta.id = a.type_id
LEFT JOIN diffusions d ON d.annonce_id = a.id
GROUP BY a.id, ta.libelle, a.titre, a.statut, a.published_at;

-- =============================================================================
-- Paramètres globaux de l'association (singleton — id = 1 toujours)
-- =============================================================================
CREATE TABLE IF NOT EXISTS parametres (
    id                           TINYINT UNSIGNED  NOT NULL DEFAULT 1,
    nom_association              VARCHAR(200)      NOT NULL DEFAULT 'Mon Association',
    slogan                       VARCHAR(300)      NULL,
    adresse                      TEXT              NULL,
    telephone                    VARCHAR(30)       NULL,
    email_contact                VARCHAR(150)      NULL,
    montant_cotisation_mensuelle DECIMAL(15,2)     NOT NULL DEFAULT 5000.00,
    devise                       VARCHAR(10)       NOT NULL DEFAULT 'FCFA',
    exercice_courant             SMALLINT UNSIGNED NOT NULL DEFAULT 2026,
    logo_url                     VARCHAR(255)      NULL,
    updated_at                   TIMESTAMP         DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT chk_parametres_singleton CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET foreign_key_checks = 1;
