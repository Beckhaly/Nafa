-- =============================================================================
-- Nafa — L2 Stored Procedures
-- MySQL 8.0 | Exécuter après 01_schema.sql
-- =============================================================================

DELIMITER $$

-- =============================================================================
-- sp_upsert_member
-- Insert ou mise à jour sécurisée d'un membre.
-- Génère le matricule MBR-AAAA-XXX à l'insertion.
-- p_role_id NULL => rôle par défaut "Membre"
-- p_member_id NULL => INSERT | valeur => UPDATE
-- À l'INSERT : crédite automatiquement le droit d'adhésion (parametres.montant_adhesion)
-- =============================================================================
DROP PROCEDURE IF EXISTS sp_upsert_member$$
CREATE PROCEDURE sp_upsert_member(
    IN  p_nom               VARCHAR(100),
    IN  p_prenom            VARCHAR(100),
    IN  p_alias             VARCHAR(100),
    IN  p_telephone         VARCHAR(20),
    IN  p_telephone2        VARCHAR(20),
    IN  p_email             VARCHAR(150),
    IN  p_date_adhesion     DATE,
    IN  p_role_id           SMALLINT UNSIGNED,
    IN  p_statut            VARCHAR(20),
    IN  p_lieu_habitation   VARCHAR(255),
    IN  p_emploi            VARCHAR(100),
    IN  p_commentaires      TEXT,
    IN  p_member_id         BIGINT UNSIGNED,
    IN  p_user_id           BIGINT UNSIGNED,
    OUT o_member_id         BIGINT UNSIGNED,
    OUT o_matricule         VARCHAR(20),
    OUT o_message           VARCHAR(255)
)
BEGIN
    DECLARE v_count         INT              DEFAULT 0;
    DECLARE v_seq           INT              DEFAULT 0;
    DECLARE v_year          INT;
    DECLARE v_role_id       SMALLINT UNSIGNED;
    DECLARE v_adhesion      DECIMAL(15,2)    DEFAULT 0;
    DECLARE v_exercice      SMALLINT UNSIGNED;
    DECLARE v_solde_avant   DECIMAL(15,2)    DEFAULT 0;
    DECLARE v_solde_apres   DECIMAL(15,2)    DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 o_message = MESSAGE_TEXT;
        SET o_member_id = NULL;
        SET o_matricule = NULL;
    END;

    START TRANSACTION;

    -- Valider le rôle si fourni
    IF p_role_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_count FROM roles_membres WHERE id = p_role_id;
        IF v_count = 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'role_id invalide';
        END IF;
        SET v_role_id = p_role_id;
    ELSE
        SELECT id INTO v_role_id FROM roles_membres WHERE libelle = 'Membre' LIMIT 1;
    END IF;

    SET v_year = YEAR(IFNULL(p_date_adhesion, CURDATE()));

    IF p_member_id IS NULL THEN
        -- Vérification doublons
        IF p_email IS NOT NULL THEN
            SELECT COUNT(*) INTO v_count FROM members WHERE email = p_email;
            IF v_count > 0 THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Email déjà utilisé par un autre membre';
            END IF;
        END IF;

        SELECT COUNT(*) INTO v_count FROM members WHERE telephone = p_telephone;
        IF v_count > 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Téléphone déjà utilisé par un autre membre';
        END IF;

        -- Matricule séquentiel par année : MBR-AAAA-001
        SELECT COALESCE(MAX(CAST(SUBSTRING_INDEX(matricule, '-', -1) AS UNSIGNED)), 0) + 1
        INTO v_seq
        FROM members
        WHERE matricule LIKE CONCAT('MBR-', v_year, '-%');

        SET o_matricule = CONCAT('MBR-', v_year, '-', LPAD(v_seq, 3, '0'));

        INSERT INTO members (matricule, nom, prenom, alias, telephone, telephone2, email,
                             date_adhesion, statut, role_id, lieu_habitation, emploi, commentaires)
        VALUES (
            o_matricule, p_nom, p_prenom, NULLIF(TRIM(p_alias), ''), p_telephone, p_telephone2, p_email,
            IFNULL(p_date_adhesion, CURDATE()),
            IFNULL(p_statut, 'actif'),
            v_role_id,
            NULLIF(TRIM(p_lieu_habitation), ''),
            NULLIF(TRIM(p_emploi), ''),
            NULLIF(TRIM(p_commentaires), '')
        );

        SET o_member_id = LAST_INSERT_ID();

        -- Droit d'adhésion → caisse
        SELECT IFNULL(montant_adhesion, 0), IFNULL(exercice_courant, YEAR(CURDATE()))
        INTO   v_adhesion, v_exercice
        FROM   parametres WHERE id = 1 LIMIT 1;

        IF v_adhesion > 0 THEN
            INSERT INTO caisse (exercice, solde) VALUES (v_exercice, 0)
            ON DUPLICATE KEY UPDATE exercice = exercice;

            SELECT solde INTO v_solde_avant FROM caisse WHERE exercice = v_exercice;
            SET v_solde_apres = v_solde_avant + v_adhesion;

            UPDATE caisse SET solde = v_solde_apres WHERE exercice = v_exercice;

            INSERT INTO caisse_mouvements
                (exercice, type, type_recette, categorie_id, montant, solde_apres, reference_id, libelle, created_by)
            VALUES
                (v_exercice, 'credit', 'adhesion', NULL, v_adhesion, v_solde_apres,
                 o_member_id,
                 CONCAT('Droit d''adhésion — ', o_matricule, ' (', p_nom, ' ', p_prenom, ')'),
                 p_user_id);
        END IF;

        SET o_message = 'OK: Membre créé';

    ELSE
        SELECT COUNT(*) INTO v_count FROM members WHERE id = p_member_id;
        IF v_count = 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Membre introuvable';
        END IF;

        IF p_email IS NOT NULL THEN
            SELECT COUNT(*) INTO v_count FROM members WHERE email = p_email AND id != p_member_id;
            IF v_count > 0 THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Email déjà utilisé par un autre membre';
            END IF;
        END IF;

        SELECT COUNT(*) INTO v_count FROM members WHERE telephone = p_telephone AND id != p_member_id;
        IF v_count > 0 THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Téléphone déjà utilisé par un autre membre';
        END IF;

        UPDATE members
        SET nom             = p_nom,
            prenom          = p_prenom,
            alias           = NULLIF(TRIM(p_alias), ''),
            telephone       = p_telephone,
            telephone2      = p_telephone2,
            email           = p_email,
            date_adhesion   = IFNULL(p_date_adhesion, date_adhesion),
            statut          = IFNULL(p_statut, statut),
            role_id         = v_role_id,
            lieu_habitation = NULLIF(TRIM(p_lieu_habitation), ''),
            emploi          = NULLIF(TRIM(p_emploi), ''),
            commentaires    = NULLIF(TRIM(p_commentaires), '')
        WHERE id = p_member_id;

        SELECT matricule INTO o_matricule FROM members WHERE id = p_member_id;
        SET o_member_id = p_member_id;
        SET o_message   = 'OK: Membre mis à jour';
    END IF;

    COMMIT;
END$$


-- =============================================================================
-- sp_pay_contribution  (cotisation mensuelle)
-- Transaction atomique :
--   1. Crée ou met à jour la ligne contributions
--   2. Détermine statut paid / partial / unpaid
--   3. Génère reçu REC-AAAA-MM-XXXXX
--   4. Met à jour caisse (INSERT … ON DUPLICATE KEY)
--   5. Insère mouvement dans caisse_mouvements (type_recette = cotisation_mensuelle)
--   6. Trace dans audit_log
-- =============================================================================
DROP PROCEDURE IF EXISTS sp_pay_contribution$$
CREATE PROCEDURE sp_pay_contribution(
    IN  p_member_id  BIGINT UNSIGNED,
    IN  p_annee      YEAR,
    IN  p_mois       TINYINT UNSIGNED,
    IN  p_montant    DECIMAL(15,2),
    IN  p_montant_du DECIMAL(15,2),
    IN  p_user_id    BIGINT UNSIGNED,
    OUT o_reference_recu VARCHAR(30),
    OUT o_statut         VARCHAR(20),
    OUT o_message        VARCHAR(255)
)
BEGIN
    DECLARE v_contrib_id    BIGINT UNSIGNED;
    DECLARE v_montant_paye  DECIMAL(15,2) DEFAULT 0.00;
    DECLARE v_nouveau_paye  DECIMAL(15,2);
    DECLARE v_nouveau_solde DECIMAL(15,2);
    DECLARE v_seq           INT;
    DECLARE v_member_ok     INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 o_message = MESSAGE_TEXT;
        SET o_reference_recu = NULL;
        SET o_statut         = NULL;
    END;

    IF p_montant <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Le montant doit être positif';
    END IF;
    IF p_mois NOT BETWEEN 1 AND 12 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Mois invalide (1-12)';
    END IF;

    SELECT COUNT(*) INTO v_member_ok FROM members WHERE id = p_member_id AND statut = 'actif';
    IF v_member_ok = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Membre introuvable ou inactif';
    END IF;

    START TRANSACTION;

    SELECT id, montant_paye INTO v_contrib_id, v_montant_paye
    FROM contributions
    WHERE member_id = p_member_id AND annee = p_annee AND mois = p_mois
    FOR UPDATE;

    IF v_contrib_id IS NULL THEN
        INSERT INTO contributions (member_id, annee, mois, montant_du, montant_paye, statut)
        VALUES (p_member_id, p_annee, p_mois, p_montant_du, 0.00, 'unpaid');
        SET v_contrib_id   = LAST_INSERT_ID();
        SET v_montant_paye = 0.00;
    END IF;

    SET v_nouveau_paye = v_montant_paye + p_montant;

    IF v_nouveau_paye >= p_montant_du THEN
        SET o_statut = 'paid';
    ELSEIF v_nouveau_paye > 0 THEN
        SET o_statut = 'partial';
    ELSE
        SET o_statut = 'unpaid';
    END IF;

    -- Reçu : REC-AAAA-MM-XXXXX
    SELECT COALESCE(MAX(CAST(SUBSTRING_INDEX(reference_recu, '-', -1) AS UNSIGNED)), 0) + 1
    INTO v_seq
    FROM contributions
    WHERE reference_recu LIKE CONCAT('REC-', p_annee, '-', LPAD(p_mois, 2, '0'), '-%');

    SET o_reference_recu = CONCAT('REC-', p_annee, '-', LPAD(p_mois, 2, '0'), '-', LPAD(v_seq, 5, '0'));

    UPDATE contributions
    SET montant_paye   = v_nouveau_paye,
        statut         = o_statut,
        date_paiement  = CURDATE(),
        reference_recu = o_reference_recu
    WHERE id = v_contrib_id;

    INSERT INTO caisse (exercice, solde) VALUES (p_annee, p_montant)
    ON DUPLICATE KEY UPDATE solde = solde + p_montant;

    SELECT solde INTO v_nouveau_solde FROM caisse WHERE exercice = p_annee;

    INSERT INTO caisse_mouvements
        (exercice, type, type_recette, categorie_id, montant, solde_apres, reference_id, libelle, created_by)
    VALUES
        (p_annee, 'credit', 'cotisation_mensuelle', NULL, p_montant, v_nouveau_solde, v_contrib_id,
         CONCAT('Cotisation ', p_annee, '-', LPAD(p_mois, 2, '0'), ' — ', o_reference_recu),
         p_user_id);

    INSERT INTO audit_log (action, table_name, record_id, montant, user_id, details)
    VALUES ('PAIEMENT_COTISATION', 'contributions', v_contrib_id, p_montant, p_user_id,
            JSON_OBJECT('member_id', p_member_id, 'annee', p_annee, 'mois', p_mois,
                        'montant_verse', p_montant, 'nouveau_statut', o_statut, 'recu', o_reference_recu));

    COMMIT;
    SET o_message = CONCAT('OK: Paiement enregistré — ', o_reference_recu);
END$$


-- =============================================================================
-- sp_pay_cotisation_exceptionnelle
-- Enregistre le paiement d'une cotisation exceptionnelle existante.
-- Transaction atomique identique à sp_pay_contribution.
-- Reçu format : CEX-AAAA-XXXXX
-- =============================================================================
DROP PROCEDURE IF EXISTS sp_pay_cotisation_exceptionnelle$$
CREATE PROCEDURE sp_pay_cotisation_exceptionnelle(
    IN  p_cex_id     BIGINT UNSIGNED,
    IN  p_montant    DECIMAL(15,2),
    IN  p_user_id    BIGINT UNSIGNED,
    OUT o_reference_recu VARCHAR(30),
    OUT o_statut         VARCHAR(20),
    OUT o_message        VARCHAR(255)
)
BEGIN
    DECLARE v_member_id     BIGINT UNSIGNED;
    DECLARE v_montant_du    DECIMAL(15,2);
    DECLARE v_montant_paye  DECIMAL(15,2);
    DECLARE v_nouveau_paye  DECIMAL(15,2);
    DECLARE v_nouveau_solde DECIMAL(15,2);
    DECLARE v_exercice      YEAR;
    DECLARE v_seq           INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 o_message = MESSAGE_TEXT;
        SET o_reference_recu = NULL;
        SET o_statut         = NULL;
    END;

    IF p_montant <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Le montant doit être positif';
    END IF;

    START TRANSACTION;

    SELECT member_id, montant_du, montant_paye
    INTO   v_member_id, v_montant_du, v_montant_paye
    FROM   cotisations_exceptionnelles
    WHERE  id = p_cex_id
    FOR UPDATE;

    IF v_member_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cotisation exceptionnelle introuvable';
    END IF;

    SET v_nouveau_paye = v_montant_paye + p_montant;
    SET v_exercice     = YEAR(CURDATE());

    IF v_nouveau_paye >= v_montant_du THEN
        SET o_statut = 'paid';
    ELSEIF v_nouveau_paye > 0 THEN
        SET o_statut = 'partial';
    ELSE
        SET o_statut = 'unpaid';
    END IF;

    -- Reçu : CEX-AAAA-XXXXX
    SELECT COALESCE(MAX(CAST(SUBSTRING_INDEX(reference_recu, '-', -1) AS UNSIGNED)), 0) + 1
    INTO v_seq
    FROM cotisations_exceptionnelles
    WHERE reference_recu LIKE CONCAT('CEX-', v_exercice, '-%');

    SET o_reference_recu = CONCAT('CEX-', v_exercice, '-', LPAD(v_seq, 5, '0'));

    UPDATE cotisations_exceptionnelles
    SET montant_paye   = v_nouveau_paye,
        statut         = o_statut,
        date_paiement  = CURDATE(),
        reference_recu = o_reference_recu
    WHERE id = p_cex_id;

    INSERT INTO caisse (exercice, solde) VALUES (v_exercice, p_montant)
    ON DUPLICATE KEY UPDATE solde = solde + p_montant;

    SELECT solde INTO v_nouveau_solde FROM caisse WHERE exercice = v_exercice;

    INSERT INTO caisse_mouvements
        (exercice, type, type_recette, categorie_id, montant, solde_apres, reference_id, libelle, created_by)
    VALUES
        (v_exercice, 'credit', 'cotisation_exceptionnelle', NULL, p_montant, v_nouveau_solde,
         p_cex_id, CONCAT('Cot. exceptionnelle — ', o_reference_recu), p_user_id);

    INSERT INTO audit_log (action, table_name, record_id, montant, user_id, details)
    VALUES ('PAIEMENT_COTISATION_EXCEPTIONNELLE', 'cotisations_exceptionnelles', p_cex_id,
            p_montant, p_user_id,
            JSON_OBJECT('member_id', v_member_id, 'montant_verse', p_montant,
                        'nouveau_statut', o_statut, 'recu', o_reference_recu));

    COMMIT;
    SET o_message = CONCAT('OK: Paiement exceptionnel enregistré — ', o_reference_recu);
END$$


-- =============================================================================
-- sp_create_cotisation_exceptionnelle
-- Crée un appel de fonds exceptionnel pour un ou tous les membres actifs.
-- p_member_id NULL => génère une ligne pour CHAQUE membre actif.
-- =============================================================================
DROP PROCEDURE IF EXISTS sp_create_cotisation_exceptionnelle$$
CREATE PROCEDURE sp_create_cotisation_exceptionnelle(
    IN  p_member_id    BIGINT UNSIGNED,
    IN  p_event_id     BIGINT UNSIGNED,
    IN  p_annonce_id   BIGINT UNSIGNED,
    IN  p_libelle      VARCHAR(255),
    IN  p_montant_du   DECIMAL(15,2),
    IN  p_date_echeance DATE,
    IN  p_user_id      BIGINT UNSIGNED,
    OUT o_nb_crees     INT,
    OUT o_message      VARCHAR(255)
)
BEGIN
    DECLARE v_done      INT DEFAULT 0;
    DECLARE v_mid       BIGINT UNSIGNED;
    DECLARE v_count     INT DEFAULT 0;

    DECLARE cur_members CURSOR FOR
        SELECT id FROM members WHERE statut = 'actif';
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 o_message = MESSAGE_TEXT;
        SET o_nb_crees = 0;
    END;

    IF p_montant_du <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Le montant doit être positif';
    END IF;
    IF p_libelle IS NULL OR TRIM(p_libelle) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Le libellé est obligatoire';
    END IF;

    START TRANSACTION;

    IF p_member_id IS NOT NULL THEN
        -- Un seul membre ciblé
        INSERT INTO cotisations_exceptionnelles
            (member_id, event_id, annonce_id, libelle, montant_du, date_echeance, created_by)
        VALUES
            (p_member_id, p_event_id, p_annonce_id, p_libelle, p_montant_du, p_date_echeance, p_user_id);
        SET v_count = 1;
    ELSE
        -- Tous les membres actifs
        OPEN cur_members;
        loop_members: LOOP
            FETCH cur_members INTO v_mid;
            IF v_done THEN LEAVE loop_members; END IF;

            INSERT INTO cotisations_exceptionnelles
                (member_id, event_id, annonce_id, libelle, montant_du, date_echeance, created_by)
            VALUES
                (v_mid, p_event_id, p_annonce_id, p_libelle, p_montant_du, p_date_echeance, p_user_id);

            SET v_count = v_count + 1;
        END LOOP;
        CLOSE cur_members;
    END IF;

    INSERT INTO audit_log (action, table_name, record_id, montant, user_id, details)
    VALUES ('CREATION_COTISATION_EXCEPTIONNELLE', 'cotisations_exceptionnelles', NULL,
            p_montant_du * v_count, p_user_id,
            JSON_OBJECT('libelle', p_libelle, 'nb_membres', v_count,
                        'event_id', p_event_id, 'annonce_id', p_annonce_id, 'echeance', p_date_echeance));

    COMMIT;
    SET o_nb_crees = v_count;
    SET o_message  = CONCAT('OK: ', v_count, ' cotisation(s) exceptionnelle(s) créée(s)');
END$$


-- =============================================================================
-- sp_generate_loan_schedule
-- Crée un prêt + tableau d'amortissement complet (amortissement constant).
-- Formule mensualité : M = P × r(1+r)^n / ((1+r)^n − 1)
-- =============================================================================
DROP PROCEDURE IF EXISTS sp_generate_loan_schedule$$
CREATE PROCEDURE sp_generate_loan_schedule(
    IN  p_member_id   BIGINT UNSIGNED,
    IN  p_montant     DECIMAL(15,2),
    IN  p_taux_annuel DECIMAL(5,2),
    IN  p_duree_mois  TINYINT UNSIGNED,
    IN  p_date_debut  DATE,
    IN  p_user_id     BIGINT UNSIGNED,
    OUT o_loan_id     BIGINT UNSIGNED,
    OUT o_mensualite  DECIMAL(15,2),
    OUT o_message     VARCHAR(255)
)
BEGIN
    DECLARE v_taux_mensuel DOUBLE;
    DECLARE v_mensualite   DOUBLE;
    DECLARE v_capital      DOUBLE;
    DECLARE v_interets     DOUBLE;
    DECLARE v_capital_rest DOUBLE;
    DECLARE v_factor       DOUBLE;
    DECLARE v_i            TINYINT DEFAULT 1;
    DECLARE v_date_ech     DATE;
    DECLARE v_member_ok    INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 o_message = MESSAGE_TEXT;
        SET o_loan_id    = NULL;
        SET o_mensualite = NULL;
    END;

    SELECT COUNT(*) INTO v_member_ok FROM members WHERE id = p_member_id AND statut = 'actif';
    IF v_member_ok = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Membre introuvable ou inactif';
    END IF;
    IF p_montant <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Le montant du prêt doit être positif';
    END IF;
    IF p_duree_mois = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La durée doit être supérieure à 0';
    END IF;

    START TRANSACTION;

    SET v_taux_mensuel = p_taux_annuel / 12.0 / 100.0;
    SET v_capital_rest = p_montant;

    IF v_taux_mensuel = 0 THEN
        SET v_mensualite = p_montant / p_duree_mois;
    ELSE
        SET v_factor     = POW(1 + v_taux_mensuel, p_duree_mois);
        SET v_mensualite = p_montant * v_taux_mensuel * v_factor / (v_factor - 1);
    END IF;

    SET o_mensualite = ROUND(v_mensualite, 2);

    INSERT INTO loans (member_id, montant, taux_interet, duree_mois, mensualite, date_debut, statut)
    VALUES (p_member_id, p_montant, p_taux_annuel, p_duree_mois, o_mensualite,
            IFNULL(p_date_debut, CURDATE()), 'actif');

    SET o_loan_id = LAST_INSERT_ID();

    WHILE v_i <= p_duree_mois DO
        SET v_date_ech = DATE_ADD(IFNULL(p_date_debut, CURDATE()), INTERVAL v_i MONTH);

        IF v_taux_mensuel = 0 THEN
            SET v_interets = 0;
            SET v_capital  = ROUND(v_mensualite, 2);
        ELSE
            SET v_interets = ROUND(v_capital_rest * v_taux_mensuel, 2);
            SET v_capital  = ROUND(v_mensualite - v_interets, 2);
        END IF;

        -- Ajustement arrondi dernière échéance
        IF v_i = p_duree_mois THEN
            SET v_capital = ROUND(v_capital_rest, 2);
        END IF;

        SET v_capital_rest = ROUND(v_capital_rest - v_capital, 2);
        IF v_capital_rest < 0 THEN SET v_capital_rest = 0; END IF;

        INSERT INTO loan_schedule (
            loan_id, numero_echeance, date_echeance,
            montant_echeance, capital, interets, capital_restant, statut
        ) VALUES (
            o_loan_id, v_i, v_date_ech,
            ROUND(v_capital + v_interets, 2), v_capital, v_interets, v_capital_rest, 'pending'
        );

        SET v_i = v_i + 1;
    END WHILE;

    INSERT INTO audit_log (action, table_name, record_id, montant, user_id, details)
    VALUES ('CREATION_PRET', 'loans', o_loan_id, p_montant, p_user_id,
            JSON_OBJECT('member_id', p_member_id, 'montant', p_montant,
                        'taux', p_taux_annuel, 'duree_mois', p_duree_mois, 'mensualite', o_mensualite));

    COMMIT;
    SET o_message = CONCAT('OK: Prêt créé — ', p_duree_mois, ' échéances générées');
END$$


-- =============================================================================
-- sp_get_monthly_pivot
-- Matrice de pointage Jan–Déc (cotisations mensuelles uniquement).
-- Valeurs : 'paid' | 'partial' | 'unpaid' | 'future'
-- =============================================================================
DROP PROCEDURE IF EXISTS sp_get_monthly_pivot$$
CREATE PROCEDURE sp_get_monthly_pivot(
    IN p_annee YEAR
)
BEGIN
    SELECT
        m.id AS member_id,
        m.matricule, m.nom, m.prenom, m.alias,
        CONCAT(m.nom, ' ', m.prenom, IFNULL(CONCAT(' (', m.alias, ')'), '')) AS nom_complet,
        rm.libelle AS role,

        CASE WHEN CONCAT(p_annee,'-01') > DATE_FORMAT(CURDATE(),'%Y-%m') THEN 'future'
             ELSE COALESCE(MAX(CASE WHEN c.mois=1  THEN c.statut END),'unpaid') END AS jan,
        CASE WHEN CONCAT(p_annee,'-02') > DATE_FORMAT(CURDATE(),'%Y-%m') THEN 'future'
             ELSE COALESCE(MAX(CASE WHEN c.mois=2  THEN c.statut END),'unpaid') END AS fev,
        CASE WHEN CONCAT(p_annee,'-03') > DATE_FORMAT(CURDATE(),'%Y-%m') THEN 'future'
             ELSE COALESCE(MAX(CASE WHEN c.mois=3  THEN c.statut END),'unpaid') END AS mar,
        CASE WHEN CONCAT(p_annee,'-04') > DATE_FORMAT(CURDATE(),'%Y-%m') THEN 'future'
             ELSE COALESCE(MAX(CASE WHEN c.mois=4  THEN c.statut END),'unpaid') END AS avr,
        CASE WHEN CONCAT(p_annee,'-05') > DATE_FORMAT(CURDATE(),'%Y-%m') THEN 'future'
             ELSE COALESCE(MAX(CASE WHEN c.mois=5  THEN c.statut END),'unpaid') END AS mai,
        CASE WHEN CONCAT(p_annee,'-06') > DATE_FORMAT(CURDATE(),'%Y-%m') THEN 'future'
             ELSE COALESCE(MAX(CASE WHEN c.mois=6  THEN c.statut END),'unpaid') END AS jun,
        CASE WHEN CONCAT(p_annee,'-07') > DATE_FORMAT(CURDATE(),'%Y-%m') THEN 'future'
             ELSE COALESCE(MAX(CASE WHEN c.mois=7  THEN c.statut END),'unpaid') END AS jul,
        CASE WHEN CONCAT(p_annee,'-08') > DATE_FORMAT(CURDATE(),'%Y-%m') THEN 'future'
             ELSE COALESCE(MAX(CASE WHEN c.mois=8  THEN c.statut END),'unpaid') END AS aou,
        CASE WHEN CONCAT(p_annee,'-09') > DATE_FORMAT(CURDATE(),'%Y-%m') THEN 'future'
             ELSE COALESCE(MAX(CASE WHEN c.mois=9  THEN c.statut END),'unpaid') END AS sep,
        CASE WHEN CONCAT(p_annee,'-10') > DATE_FORMAT(CURDATE(),'%Y-%m') THEN 'future'
             ELSE COALESCE(MAX(CASE WHEN c.mois=10 THEN c.statut END),'unpaid') END AS oct,
        CASE WHEN CONCAT(p_annee,'-11') > DATE_FORMAT(CURDATE(),'%Y-%m') THEN 'future'
             ELSE COALESCE(MAX(CASE WHEN c.mois=11 THEN c.statut END),'unpaid') END AS nov,
        CASE WHEN CONCAT(p_annee,'-12') > DATE_FORMAT(CURDATE(),'%Y-%m') THEN 'future'
             ELSE COALESCE(MAX(CASE WHEN c.mois=12 THEN c.statut END),'unpaid') END AS dec_

    FROM members m
    JOIN roles_membres rm ON rm.id = m.role_id
    LEFT JOIN contributions c ON c.member_id = m.id AND c.annee = p_annee
    WHERE m.statut = 'actif'
    GROUP BY m.id, m.matricule, m.nom, m.prenom, m.alias, rm.libelle
    ORDER BY rm.ordre, m.matricule;
END$$


-- =============================================================================
-- sp_record_don
-- Enregistre un don, met à jour la caisse et le grand livre.
-- member_id NULL => donateur externe (donateur_nom obligatoire).
-- =============================================================================
DROP PROCEDURE IF EXISTS sp_record_don$$
CREATE PROCEDURE sp_record_don(
    IN  p_member_id    BIGINT UNSIGNED,
    IN  p_event_id     BIGINT UNSIGNED,
    IN  p_donateur_nom VARCHAR(150),
    IN  p_montant      DECIMAL(15,2),
    IN  p_date_don     DATE,
    IN  p_motif        VARCHAR(255),
    IN  p_user_id      BIGINT UNSIGNED,
    OUT o_don_id       BIGINT UNSIGNED,
    OUT o_reference_recu VARCHAR(30),
    OUT o_message      VARCHAR(255)
)
BEGIN
    DECLARE v_annee         YEAR;
    DECLARE v_nouveau_solde DECIMAL(15,2);
    DECLARE v_seq           INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 o_message = MESSAGE_TEXT;
        SET o_don_id         = NULL;
        SET o_reference_recu = NULL;
    END;

    IF p_montant <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Le montant du don doit être positif';
    END IF;
    IF p_member_id IS NULL AND (p_donateur_nom IS NULL OR TRIM(p_donateur_nom) = '') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Nom du donateur requis si non-membre';
    END IF;

    SET v_annee = YEAR(IFNULL(p_date_don, CURDATE()));

    START TRANSACTION;

    -- Reçu : DON-AAAA-XXXXX
    SELECT COALESCE(MAX(CAST(SUBSTRING_INDEX(reference_recu, '-', -1) AS UNSIGNED)), 0) + 1
    INTO v_seq
    FROM dons
    WHERE reference_recu LIKE CONCAT('DON-', v_annee, '-%');

    SET o_reference_recu = CONCAT('DON-', v_annee, '-', LPAD(v_seq, 5, '0'));

    INSERT INTO dons (member_id, event_id, donateur_nom, montant, date_don, motif, reference_recu, created_by)
    VALUES (p_member_id, p_event_id, p_donateur_nom, p_montant,
            IFNULL(p_date_don, CURDATE()), p_motif, o_reference_recu, p_user_id);

    SET o_don_id = LAST_INSERT_ID();

    INSERT INTO caisse (exercice, solde) VALUES (v_annee, p_montant)
    ON DUPLICATE KEY UPDATE solde = solde + p_montant;

    SELECT solde INTO v_nouveau_solde FROM caisse WHERE exercice = v_annee;

    INSERT INTO caisse_mouvements
        (exercice, type, type_recette, categorie_id, montant, solde_apres, reference_id, libelle, created_by)
    VALUES
        (v_annee, 'credit', 'don', NULL, p_montant, v_nouveau_solde, o_don_id,
         CONCAT('Don — ', IFNULL(p_donateur_nom, CONCAT('Membre #', p_member_id)),
                ' — ', o_reference_recu),
         p_user_id);

    INSERT INTO audit_log (action, table_name, record_id, montant, user_id, details)
    VALUES ('ENREGISTREMENT_DON', 'dons', o_don_id, p_montant, p_user_id,
            JSON_OBJECT('member_id', p_member_id, 'event_id', p_event_id,
                        'donateur', p_donateur_nom, 'montant', p_montant, 'recu', o_reference_recu));

    COMMIT;
    SET o_message = CONCAT('OK: Don enregistré — ', o_reference_recu);
END$$


-- =============================================================================
-- sp_record_depense
-- Enregistre une dépense, débite la caisse et le grand livre.
-- categorie_id FK → categories_depenses.id
-- =============================================================================
DROP PROCEDURE IF EXISTS sp_record_depense$$
CREATE PROCEDURE sp_record_depense(
    IN  p_categorie_id   SMALLINT UNSIGNED,
    IN  p_event_id       BIGINT UNSIGNED,
    IN  p_libelle        VARCHAR(255),
    IN  p_montant        DECIMAL(15,2),
    IN  p_date_depense   DATE,
    IN  p_beneficiaire   VARCHAR(150),
    IN  p_reference_piece VARCHAR(50),
    IN  p_user_id        BIGINT UNSIGNED,
    OUT o_depense_id     BIGINT UNSIGNED,
    OUT o_message        VARCHAR(255)
)
BEGIN
    DECLARE v_annee         YEAR;
    DECLARE v_solde_actuel  DECIMAL(15,2) DEFAULT 0.00;
    DECLARE v_nouveau_solde DECIMAL(15,2);
    DECLARE v_cat_ok        INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 o_message = MESSAGE_TEXT;
        SET o_depense_id = NULL;
    END;

    IF p_montant <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Le montant de la dépense doit être positif';
    END IF;

    SELECT COUNT(*) INTO v_cat_ok FROM categories_depenses WHERE id = p_categorie_id;
    IF v_cat_ok = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Catégorie de dépense invalide';
    END IF;

    SET v_annee = YEAR(IFNULL(p_date_depense, CURDATE()));

    START TRANSACTION;

    SELECT COALESCE(solde, 0) INTO v_solde_actuel
    FROM caisse WHERE exercice = v_annee FOR UPDATE;

    IF v_solde_actuel < p_montant THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Solde de caisse insuffisant';
    END IF;

    INSERT INTO depenses (categorie_id, event_id, libelle, montant, date_depense, beneficiaire, reference_piece, created_by)
    VALUES (p_categorie_id, p_event_id, p_libelle, p_montant,
            IFNULL(p_date_depense, CURDATE()), p_beneficiaire, p_reference_piece, p_user_id);

    SET o_depense_id    = LAST_INSERT_ID();
    SET v_nouveau_solde = v_solde_actuel - p_montant;

    UPDATE caisse SET solde = v_nouveau_solde WHERE exercice = v_annee;

    INSERT INTO caisse_mouvements
        (exercice, type, type_recette, categorie_id, montant, solde_apres, reference_id, libelle, created_by)
    VALUES
        (v_annee, 'debit', NULL, p_categorie_id, p_montant, v_nouveau_solde, o_depense_id,
         CONCAT(p_libelle, IFNULL(CONCAT(' — ', p_beneficiaire), '')),
         p_user_id);

    INSERT INTO audit_log (action, table_name, record_id, montant, user_id, details)
    VALUES ('ENREGISTREMENT_DEPENSE', 'depenses', o_depense_id, p_montant, p_user_id,
            JSON_OBJECT('categorie_id', p_categorie_id, 'event_id', p_event_id,
                        'libelle', p_libelle, 'montant', p_montant, 'beneficiaire', p_beneficiaire));

    COMMIT;
    SET o_message = 'OK: Dépense enregistrée';
END$$


-- =============================================================================
-- sp_update_loan_statuts
-- Maintenance quotidienne : marque les échéances dépassées et met à jour
-- le statut des prêts (en_retard / solde).
-- À appeler via le scheduler Laravel ou un cron MySQL.
-- =============================================================================
DROP PROCEDURE IF EXISTS sp_update_loan_statuts$$
CREATE PROCEDURE sp_update_loan_statuts()
BEGIN
    UPDATE loan_schedule
    SET statut = 'late'
    WHERE statut = 'pending' AND date_echeance < CURDATE();

    UPDATE loans l
    SET statut = 'en_retard', updated_at = CURRENT_TIMESTAMP
    WHERE statut = 'actif'
      AND EXISTS (
          SELECT 1 FROM loan_schedule ls
          WHERE ls.loan_id = l.id AND ls.statut = 'late'
      );

    UPDATE loans l
    SET statut = 'solde', updated_at = CURRENT_TIMESTAMP
    WHERE statut IN ('actif','en_retard')
      AND NOT EXISTS (
          SELECT 1 FROM loan_schedule ls
          WHERE ls.loan_id = l.id AND ls.statut != 'paid'
      );
END$$

-- =============================================================================
-- sp_publier_annonce
-- Publie une annonce et génère la file de diffusion pour les membres actifs.
-- p_canal : 'sms' | 'whatsapp' | 'both'
-- p_member_ids JSON (optionnel) : liste d'IDs cibles ex ["1","3","7"].
--   NULL => tous les membres actifs ayant un téléphone.
-- Laravel lit ensuite les diffusions 'pending' via une queue Job.
-- =============================================================================
DROP PROCEDURE IF EXISTS sp_publier_annonce$$
CREATE PROCEDURE sp_publier_annonce(
    IN  p_annonce_id  BIGINT UNSIGNED,
    IN  p_canal       VARCHAR(10),
    IN  p_member_ids  JSON,
    IN  p_user_id     BIGINT UNSIGNED,
    OUT o_nb_sms      INT,
    OUT o_nb_whatsapp INT,
    OUT o_message     VARCHAR(255)
)
BEGIN
    DECLARE v_statut_annonce VARCHAR(20);
    DECLARE v_done           INT DEFAULT 0;
    DECLARE v_mid            BIGINT UNSIGNED;
    DECLARE v_tel            VARCHAR(20);
    DECLARE v_count_sms      INT DEFAULT 0;
    DECLARE v_count_wa       INT DEFAULT 0;

    DECLARE cur_all CURSOR FOR
        SELECT id, telephone FROM members
        WHERE statut = 'actif' AND telephone IS NOT NULL AND telephone != '';

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 o_message = MESSAGE_TEXT;
        SET o_nb_sms      = 0;
        SET o_nb_whatsapp = 0;
    END;

    IF p_canal NOT IN ('sms','whatsapp','both') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Canal invalide : sms | whatsapp | both';
    END IF;

    SELECT statut INTO v_statut_annonce FROM annonces WHERE id = p_annonce_id;
    IF v_statut_annonce IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Annonce introuvable';
    END IF;
    IF v_statut_annonce = 'archive' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Impossible de diffuser une annonce archivée';
    END IF;

    START TRANSACTION;

    -- Marquer l'annonce comme publiée
    UPDATE annonces
    SET statut = 'publie', published_at = CURRENT_TIMESTAMP
    WHERE id = p_annonce_id;

    IF p_member_ids IS NOT NULL THEN
        -- Cibles explicites : on itère sur le tableau JSON
        SET @i = 0;
        SET @n = JSON_LENGTH(p_member_ids);

        WHILE @i < @n DO
            SET v_mid = CAST(JSON_UNQUOTE(JSON_EXTRACT(p_member_ids, CONCAT('$[', @i, ']'))) AS UNSIGNED);

            SELECT telephone INTO v_tel FROM members
            WHERE id = v_mid AND statut = 'actif' LIMIT 1;

            IF v_tel IS NOT NULL THEN
                IF p_canal IN ('sms','both') THEN
                    INSERT IGNORE INTO diffusions (annonce_id, member_id, canal, telephone)
                    VALUES (p_annonce_id, v_mid, 'sms', v_tel);
                    SET v_count_sms = v_count_sms + ROW_COUNT();
                END IF;
                IF p_canal IN ('whatsapp','both') THEN
                    INSERT IGNORE INTO diffusions (annonce_id, member_id, canal, telephone)
                    VALUES (p_annonce_id, v_mid, 'whatsapp', v_tel);
                    SET v_count_wa = v_count_wa + ROW_COUNT();
                END IF;
            END IF;

            SET @i = @i + 1;
        END WHILE;

    ELSE
        -- Tous les membres actifs
        OPEN cur_all;
        loop_members: LOOP
            FETCH cur_all INTO v_mid, v_tel;
            IF v_done THEN LEAVE loop_members; END IF;

            IF p_canal IN ('sms','both') THEN
                INSERT IGNORE INTO diffusions (annonce_id, member_id, canal, telephone)
                VALUES (p_annonce_id, v_mid, 'sms', v_tel);
                SET v_count_sms = v_count_sms + ROW_COUNT();
            END IF;
            IF p_canal IN ('whatsapp','both') THEN
                INSERT IGNORE INTO diffusions (annonce_id, member_id, canal, telephone)
                VALUES (p_annonce_id, v_mid, 'whatsapp', v_tel);
                SET v_count_wa = v_count_wa + ROW_COUNT();
            END IF;
        END LOOP;
        CLOSE cur_all;
    END IF;

    INSERT INTO audit_log (action, table_name, record_id, montant, user_id, details)
    VALUES ('PUBLICATION_ANNONCE', 'annonces', p_annonce_id, NULL, p_user_id,
            JSON_OBJECT('canal', p_canal, 'nb_sms', v_count_sms,
                        'nb_whatsapp', v_count_wa,
                        'cibles_explicites', p_member_ids IS NOT NULL));

    COMMIT;

    SET o_nb_sms      = v_count_sms;
    SET o_nb_whatsapp = v_count_wa;
    SET o_message     = CONCAT('OK: ', v_count_sms + v_count_wa,
                                ' diffusion(s) en file — SMS:', v_count_sms,
                                ' | WhatsApp:', v_count_wa);
END$$


-- =============================================================================
-- sp_marquer_diffusion
-- Appelée par Laravel après réponse de l'API SMS/WhatsApp.
-- Met à jour statut, provider_ref et sent_at (ou error_msg en cas d'échec).
-- =============================================================================
DROP PROCEDURE IF EXISTS sp_marquer_diffusion$$
CREATE PROCEDURE sp_marquer_diffusion(
    IN p_diffusion_id BIGINT UNSIGNED,
    IN p_statut       VARCHAR(10),    -- 'envoye' | 'echec'
    IN p_provider_ref VARCHAR(500),
    IN p_error_msg    VARCHAR(500)
)
BEGIN
    IF p_statut NOT IN ('envoye','echec') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Statut invalide : envoye | echec';
    END IF;

    UPDATE diffusions
    SET statut       = p_statut,
        provider_ref = p_provider_ref,
        sent_at      = CASE WHEN p_statut = 'envoye' THEN CURRENT_TIMESTAMP ELSE NULL END,
        error_msg    = p_error_msg
    WHERE id = p_diffusion_id;

    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Diffusion introuvable';
    END IF;
END$$

DELIMITER ;
