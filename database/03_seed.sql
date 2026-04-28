-- =============================================================================
-- Nafa — Jeu de données de démonstration
-- Exécuter après 01_schema.sql et 02_procedures.sql
-- Contexte : Association NAFA — exercice 2026 (état au 22 avril 2026)
-- =============================================================================

SET NAMES utf8mb4;
SET foreign_key_checks = 0;

-- Désactiver l'autocommit global pour ce script
SET autocommit = 0;

-- =============================================================================
-- UTILISATEURS SYSTÈME
-- Mot de passe pour tous : "password"
-- Hash bcrypt Laravel : $2y$10$FcrXxMsGKqmCrCDDNDHS6ufWEDlJvInBIiTrVPUMKfW5ARPdnbZeO
-- =============================================================================

INSERT INTO users (id, name, email, password, role_id, member_id, is_active) VALUES
    (1, 'Administrateur',  'admin@nafa.sn',       '$2y$10$FcrXxMsGKqmCrCDDNDHS6ufWEDlJvInBIiTrVPUMKfW5ARPdnbZeO', 1, NULL, 1),
    (2, 'Koné Ibrahim',    'tresorier@nafa.sn',   '$2y$10$FcrXxMsGKqmCrCDDNDHS6ufWEDlJvInBIiTrVPUMKfW5ARPdnbZeO', 2, NULL, 1),
    (3, 'Bah Mariama',     'secretaire@nafa.sn',  '$2y$10$FcrXxMsGKqmCrCDDNDHS6ufWEDlJvInBIiTrVPUMKfW5ARPdnbZeO', 3, NULL, 1),
    (4, 'Lecteur',         'lecteur@nafa.sn',     '$2y$10$FcrXxMsGKqmCrCDDNDHS6ufWEDlJvInBIiTrVPUMKfW5ARPdnbZeO', 4, NULL, 1),
    (5, 'Diallo Amadou',   'membre@nafa.sn',      '$2y$10$FcrXxMsGKqmCrCDDNDHS6ufWEDlJvInBIiTrVPUMKfW5ARPdnbZeO', 5, NULL, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

COMMIT;

-- =============================================================================
-- MEMBRES  (via sp_upsert_member)
-- Paramètres : nom, prenom, alias, telephone, email, date_adhesion,
--              role_id, statut, member_id(NULL=INSERT)
-- =============================================================================

-- 1. Diallo Mamadou (Petit) — Président
CALL sp_upsert_member('Diallo','Mamadou','Petit',      '+224620100001','diallo.mamadou@nafa.sn', '2022-01-15', 1, 'actif', NULL, @id1, @mat1, @msg1);
-- 2. Traoré Aissatou (Abi) — Vice-Présidente
CALL sp_upsert_member('Traoré','Aissatou','Abi',       '+224620100002','traore.aissatou@nafa.sn','2022-01-15', 2, 'actif', NULL, @id2, @mat2, @msg2);
-- 3. Koné Ibrahim (Ibou) — Trésorier
CALL sp_upsert_member('Koné','Ibrahim','Ibou',         '+224620100003','kone.ibrahim@nafa.sn',   '2022-01-15', 3, 'actif', NULL, @id3, @mat3, @msg3);
-- 4. Bah Mariama (Mari) — Secrétaire
CALL sp_upsert_member('Bah','Mariama','Mari',          '+224620100004','bah.mariama@nafa.sn',    '2022-01-15', 4, 'actif', NULL, @id4, @mat4, @msg4);
-- 5. Camara Oumar — Membre
CALL sp_upsert_member('Camara','Oumar',NULL,           '+224620100005','camara.oumar@nafa.sn',   '2022-03-01', 5, 'actif', NULL, @id5, @mat5, @msg5);
-- 6. Sylla Fatoumata (Fanta) — Membre
CALL sp_upsert_member('Sylla','Fatoumata','Fanta',     '+224620100006','sylla.fanta@nafa.sn',    '2022-03-01', 5, 'actif', NULL, @id6, @mat6, @msg6);
-- 7. Barry Thierno — Membre
CALL sp_upsert_member('Barry','Thierno',NULL,          '+224620100007','barry.thierno@nafa.sn',  '2022-06-15', 5, 'actif', NULL, @id7, @mat7, @msg7);
-- 8. Sow Kadiatou (Kadi) — Membre
CALL sp_upsert_member('Sow','Kadiatou','Kadi',         '+224620100008',NULL,                     '2023-01-10', 5, 'actif', NULL, @id8, @mat8, @msg8);
-- 9. Baldé Moussa — Membre
CALL sp_upsert_member('Baldé','Moussa',NULL,           '+224620100009','balde.moussa@nafa.sn',   '2023-01-10', 5, 'actif', NULL, @id9, @mat9, @msg9);
-- 10. Diallo Hawa (Hawou) — Membre
CALL sp_upsert_member('Diallo','Hawa','Hawou',         '+224620100010','diallo.hawa@nafa.sn',    '2023-04-20', 5, 'actif', NULL, @id10,@mat10,@msg10);
-- 11. Touré Souleymane (Solo) — Membre
CALL sp_upsert_member('Touré','Souleymane','Solo',     '+224620100011','toure.solo@nafa.sn',     '2023-04-20', 5, 'actif', NULL, @id11,@mat11,@msg11);
-- 12. Keïta Adama — Auditeur
CALL sp_upsert_member('Keïta','Adama',NULL,            '+224620100012','keita.adama@nafa.sn',    '2023-09-01', 6, 'actif', NULL, @id12,@mat12,@msg12);
-- 13. Conté Arafan — Membre inactif
CALL sp_upsert_member('Conté','Arafan',NULL,           '+224620100013',NULL,                     '2021-05-01', 5, 'inactif',NULL,@id13,@mat13,@msg13);

-- Lier les utilisateurs à leurs membres
UPDATE users SET member_id = @id3 WHERE id = 2;  -- trésorier → Koné Ibrahim
UPDATE users SET member_id = @id4 WHERE id = 3;  -- secrétaire → Bah Mariama
UPDATE users SET member_id = @id1 WHERE id = 5;  -- membre demo → Diallo Amadou

COMMIT;

-- Vérification matricules
SELECT @mat1 AS 'MBR-01', @mat2 AS 'MBR-02', @mat3 AS 'MBR-03',
       @mat4 AS 'MBR-04', @mat5 AS 'MBR-05', @mat6 AS 'MBR-06';

-- =============================================================================
-- CAISSE — solde initial 2026
-- (solde d'ouverture avant les opérations ci-dessous)
-- =============================================================================

INSERT INTO caisse (exercice, solde) VALUES (2026, 350000.00)
ON DUPLICATE KEY UPDATE solde = 350000.00;

INSERT INTO caisse_mouvements
    (exercice, type, type_recette, categorie_id, montant, solde_apres, reference_id, libelle, created_by)
VALUES
    (2026, 'credit', 'don', NULL, 350000.00, 350000.00, NULL, 'Solde reporté de l\'exercice 2025', 1);

COMMIT;

-- =============================================================================
-- DONS
-- =============================================================================

CALL sp_record_don(@id1, NULL, NULL, 25000.00, '2026-01-10',
    'Contribution volontaire Assemblée Générale 2026', 1,
    @don1_id, @don1_recu, @don1_msg);

CALL sp_record_don(NULL, NULL, 'SCI Mamadou & Frères', 100000.00, '2026-02-14',
    'Parrainage célébration 10 ans de l\'association', 1,
    @don2_id, @don2_recu, @don2_msg);

CALL sp_record_don(@id6, NULL, NULL, 15000.00, '2026-03-05',
    'Don solidarité membre', 1,
    @don3_id, @don3_recu, @don3_msg);

COMMIT;
SELECT @don1_recu AS 'Don 1', @don2_recu AS 'Don 2', @don3_recu AS 'Don 3';

-- =============================================================================
-- COTISATIONS MENSUELLES 2026 (5 000 FCFA/mois/membre)
-- Janvier → tous payés sauf 1
-- Février → 8 payés, 2 partiels, 2 impayés
-- Mars    → 7 payés, 3 impayés (dont 2 partiels)
-- Avril   → 3 payés, reste en cours
-- =============================================================================

-- ---- JANVIER 2026 ----
CALL sp_pay_contribution(@id1,  2026, 1, 5000.00, 5000.00, 2, @r, @s, @m);
CALL sp_pay_contribution(@id2,  2026, 1, 5000.00, 5000.00, 2, @r, @s, @m);
CALL sp_pay_contribution(@id3,  2026, 1, 5000.00, 5000.00, 2, @r, @s, @m);
CALL sp_pay_contribution(@id4,  2026, 1, 5000.00, 5000.00, 3, @r, @s, @m);
CALL sp_pay_contribution(@id5,  2026, 1, 5000.00, 5000.00, 2, @r, @s, @m);
CALL sp_pay_contribution(@id6,  2026, 1, 5000.00, 5000.00, 2, @r, @s, @m);
CALL sp_pay_contribution(@id7,  2026, 1, 5000.00, 5000.00, 2, @r, @s, @m);
CALL sp_pay_contribution(@id8,  2026, 1, 5000.00, 5000.00, 3, @r, @s, @m);
CALL sp_pay_contribution(@id9,  2026, 1, 5000.00, 5000.00, 2, @r, @s, @m);
CALL sp_pay_contribution(@id10, 2026, 1, 5000.00, 5000.00, 2, @r, @s, @m);
CALL sp_pay_contribution(@id11, 2026, 1, 5000.00, 5000.00, 2, @r, @s, @m);
-- @id12 : impayé janvier (aucun appel)

-- ---- FÉVRIER 2026 ----
CALL sp_pay_contribution(@id1,  2026, 2, 5000.00, 5000.00, 2, @r, @s, @m);
CALL sp_pay_contribution(@id2,  2026, 2, 5000.00, 5000.00, 2, @r, @s, @m);
CALL sp_pay_contribution(@id3,  2026, 2, 5000.00, 5000.00, 2, @r, @s, @m);
CALL sp_pay_contribution(@id4,  2026, 2, 5000.00, 5000.00, 3, @r, @s, @m);
CALL sp_pay_contribution(@id5,  2026, 2, 5000.00, 5000.00, 2, @r, @s, @m);
CALL sp_pay_contribution(@id6,  2026, 2, 5000.00, 5000.00, 2, @r, @s, @m);
CALL sp_pay_contribution(@id7,  2026, 2, 5000.00, 5000.00, 2, @r, @s, @m);
CALL sp_pay_contribution(@id9,  2026, 2, 5000.00, 5000.00, 2, @r, @s, @m);
-- Partiels février
CALL sp_pay_contribution(@id8,  2026, 2, 2500.00, 5000.00, 3, @r, @s, @m);
CALL sp_pay_contribution(@id10, 2026, 2, 2000.00, 5000.00, 2, @r, @s, @m);
-- @id11, @id12 : impayés février

-- ---- MARS 2026 ----
CALL sp_pay_contribution(@id1,  2026, 3, 5000.00, 5000.00, 2, @r, @s, @m);
CALL sp_pay_contribution(@id2,  2026, 3, 5000.00, 5000.00, 2, @r, @s, @m);
CALL sp_pay_contribution(@id3,  2026, 3, 5000.00, 5000.00, 2, @r, @s, @m);
CALL sp_pay_contribution(@id4,  2026, 3, 5000.00, 5000.00, 3, @r, @s, @m);
CALL sp_pay_contribution(@id6,  2026, 3, 5000.00, 5000.00, 2, @r, @s, @m);
CALL sp_pay_contribution(@id9,  2026, 3, 5000.00, 5000.00, 2, @r, @s, @m);
CALL sp_pay_contribution(@id12, 2026, 3, 5000.00, 5000.00, 2, @r, @s, @m);
-- Partiels mars
CALL sp_pay_contribution(@id5,  2026, 3, 3000.00, 5000.00, 2, @r, @s, @m);
CALL sp_pay_contribution(@id7,  2026, 3, 1500.00, 5000.00, 2, @r, @s, @m);
-- @id8, @id10, @id11 : impayés mars

-- ---- AVRIL 2026 ----
CALL sp_pay_contribution(@id1,  2026, 4, 5000.00, 5000.00, 2, @r, @s, @m);
CALL sp_pay_contribution(@id3,  2026, 4, 5000.00, 5000.00, 2, @r, @s, @m);
CALL sp_pay_contribution(@id4,  2026, 4, 5000.00, 5000.00, 3, @r, @s, @m);
-- @id2,@id5..@id12 : non encore payés pour avril

COMMIT;

-- =============================================================================
-- PRÊTS
-- =============================================================================

-- Prêt 1 : Camara Oumar — 300 000 FCFA / 10% / 24 mois — débuté janv 2025
CALL sp_generate_loan_schedule(@id5, 300000.00, 10.00, 24, '2025-01-01', 2,
    @loan1_id, @loan1_m, @loan1_msg);
SELECT @loan1_id AS 'Prêt 1 ID', @loan1_m AS 'Mensualité', @loan1_msg;

-- Marquer les 15 premières échéances comme payées (jan 2025 → mars 2026)
UPDATE loan_schedule
SET statut = 'paid'
WHERE loan_id = @loan1_id AND numero_echeance <= 15;

-- echeances_payees et capital_restant_du sont calculés par v_loan_summary (pas de colonnes directes)

-- Prêt 2 : Sylla Fatoumata — 150 000 FCFA / 8% / 12 mois — débuté janv 2026
CALL sp_generate_loan_schedule(@id6, 150000.00, 8.00, 12, '2026-01-01', 2,
    @loan2_id, @loan2_m, @loan2_msg);
SELECT @loan2_id AS 'Prêt 2 ID', @loan2_m AS 'Mensualité', @loan2_msg;

-- Marquer les 3 premières échéances comme payées (jan-mars 2026)
UPDATE loan_schedule
SET statut = 'paid'
WHERE loan_id = @loan2_id AND numero_echeance <= 3;


-- Prêt 3 : Barry Thierno — en retard — 200 000 FCFA / 12% / 18 mois — sept 2025
CALL sp_generate_loan_schedule(@id7, 200000.00, 12.00, 18, '2025-09-01', 2,
    @loan3_id, @loan3_m, @loan3_msg);

-- 5 échéances payées, la 6e et 7e sont en retard
UPDATE loan_schedule SET statut = 'paid' WHERE loan_id = @loan3_id AND numero_echeance <= 5;
UPDATE loan_schedule SET statut = 'late' WHERE loan_id = @loan3_id AND numero_echeance IN (6, 7);
UPDATE loans SET statut = 'en_retard' WHERE id = @loan3_id;

COMMIT;

-- =============================================================================
-- ÉVÉNEMENTS
-- =============================================================================

INSERT INTO events (id, type_id, titre, description, date_debut, date_fin, lieu, statut, created_by) VALUES
    (1, 1, 'Assemblée Générale Ordinaire 2026',
     'Bilan annuel de l\'exercice 2025, élections partielles et programmation 2026.',
     '2026-01-18 09:00:00', '2026-01-18 13:00:00', 'Salle des fêtes du quartier Matam, Conakry',
     'termine', 1),

    (2, 2, 'Réunion ordinaire de mars 2026',
     'Point sur les cotisations et préparation de la fête de l\'association.',
     '2026-03-15 18:30:00', '2026-03-15 20:30:00', 'Domicile de Diallo Mamadou, Kipé',
     'termine', 3),

    (3, 4, 'Célébration du 10ème anniversaire',
     'Dîner gala, remise de distinctions et soirée culturelle.',
     '2026-06-14 17:00:00', '2026-06-14 23:59:00', 'Hôtel Camayenne, Conakry',
     'planifie', 1),

    (4, 2, 'Réunion ordinaire d\'avril 2026',
     'Suivi des prêts en cours, point caisse et divers.',
     '2026-04-27 18:30:00', '2026-04-27 20:30:00', 'Domicile de Koné Ibrahim, Ratoma',
     'planifie', 3)

ON DUPLICATE KEY UPDATE titre = VALUES(titre);

-- Participants à l'AG (événement 1 — terminé)
INSERT INTO event_participants (event_id, member_id, statut) VALUES
    (1, @id1,  'present'),
    (1, @id2,  'present'),
    (1, @id3,  'present'),
    (1, @id4,  'present'),
    (1, @id5,  'present'),
    (1, @id6,  'present'),
    (1, @id7,  'absent'),
    (1, @id8,  'present'),
    (1, @id9,  'present'),
    (1, @id10, 'present'),
    (1, @id11, 'absent'),
    (1, @id12, 'present')
ON DUPLICATE KEY UPDATE statut = VALUES(statut);

-- Participants à la réunion de mars (événement 2)
INSERT INTO event_participants (event_id, member_id, statut) VALUES
    (2, @id1,  'present'),
    (2, @id2,  'present'),
    (2, @id3,  'present'),
    (2, @id4,  'present'),
    (2, @id5,  'absent'),
    (2, @id6,  'present'),
    (2, @id7,  'present'),
    (2, @id8,  'present'),
    (2, @id9,  'absent'),
    (2, @id10, 'present'),
    (2, @id11, 'present'),
    (2, @id12, 'absent')
ON DUPLICATE KEY UPDATE statut = VALUES(statut);

COMMIT;

-- =============================================================================
-- COTISATIONS EXCEPTIONNELLES — Célébration 10 ans (Event 3)
-- =============================================================================

CALL sp_create_cotisation_exceptionnelle(
    NULL, 3, 'Participation célébration 10ème anniversaire', 10000.00, '2026-05-31', 1,
    @cex_nb, @cex_msg);
SELECT @cex_nb AS 'Nb CEX créées', @cex_msg;

-- Payer quelques membres
SELECT id INTO @cex1 FROM cotisations_exceptionnelles WHERE member_id = @id1 AND libelle LIKE '%anniversaire%' LIMIT 1;
SELECT id INTO @cex2 FROM cotisations_exceptionnelles WHERE member_id = @id2 AND libelle LIKE '%anniversaire%' LIMIT 1;
SELECT id INTO @cex3 FROM cotisations_exceptionnelles WHERE member_id = @id3 AND libelle LIKE '%anniversaire%' LIMIT 1;
SELECT id INTO @cex4 FROM cotisations_exceptionnelles WHERE member_id = @id4 AND libelle LIKE '%anniversaire%' LIMIT 1;
SELECT id INTO @cex6 FROM cotisations_exceptionnelles WHERE member_id = @id6 AND libelle LIKE '%anniversaire%' LIMIT 1;

CALL sp_pay_cotisation_exceptionnelle(@cex1, 10000.00, 2, @r, @s, @m);
CALL sp_pay_cotisation_exceptionnelle(@cex2, 10000.00, 2, @r, @s, @m);
CALL sp_pay_cotisation_exceptionnelle(@cex3, 10000.00, 2, @r, @s, @m);
CALL sp_pay_cotisation_exceptionnelle(@cex4, 10000.00, 3, @r, @s, @m);
CALL sp_pay_cotisation_exceptionnelle(@cex6,  5000.00, 2, @r, @s, @m);  -- paiement partiel

COMMIT;

-- =============================================================================
-- DÉPENSES
-- =============================================================================

-- Fournitures pour l'AG
CALL sp_record_depense(1, 1, 'Fournitures AG — papeterie, impression ordre du jour', 8500.00,
    '2026-01-17', 'Librairie Centrale Conakry', 'FAC-2026-0117', 1,
    @dep1_id, @dep1_msg);

-- Communication (banderoles + sono)
CALL sp_record_depense(3, 1, 'Location sono et banderoles AG', 35000.00,
    '2026-01-18', 'Sono Service Conakry', 'CONT-2026-0118', 1,
    @dep2_id, @dep2_msg);

-- Frais réunion mars (collation)
CALL sp_record_depense(4, 2, 'Collation réunion mars 2026', 12000.00,
    '2026-03-15', 'Pâtisserie Al Amine', 'REC-PATR-2026-031', 1,
    @dep3_id, @dep3_msg);

-- Transport président (visites membres malades)
CALL sp_record_depense(2, NULL, 'Frais transport visite membres — mars', 7500.00,
    '2026-03-28', 'Diallo Mamadou', NULL, 1,
    @dep4_id, @dep4_msg);

-- Acompte anniversaire
CALL sp_record_depense(4, 3, 'Acompte réservation Hôtel Camayenne — 10 ans', 50000.00,
    '2026-04-10', 'Hôtel Camayenne', 'FACT-CAM-2026-042', 1,
    @dep5_id, @dep5_msg);

COMMIT;
SELECT @dep1_msg, @dep2_msg, @dep3_msg, @dep4_msg, @dep5_msg;

-- =============================================================================
-- ANNONCES
-- =============================================================================

-- types_annonce IDs : 1=Mariage, 2=Décès, 3=Baptême, 4=Naissance, 5=Anniversaire,
--                     6=Réunion, 7=Autre

-- Annonce 1 : Mariage — à diffuser
INSERT INTO annonces (id, type_id, member_id, titre, contenu, date_evenement, statut) VALUES
    (1, 1, @id8,
     'Mariage de Sow Kadiatou',
     'Chers membres, nous vous informons que notre sœur Sow Kadiatou (Kadi) célèbre son mariage le 03/05/2026 à Conakry. Votre présence et soutien sont les bienvenus. — NAFA',
     '2026-05-03', 'brouillon')
ON DUPLICATE KEY UPDATE statut = 'brouillon';

-- Annonce 2 : Naissance — publiée
INSERT INTO annonces (id, type_id, member_id, titre, contenu, date_evenement, statut, published_at) VALUES
    (2, 4, @id5,
     'Naissance chez les Camara',
     'La famille NAFA félicite chaleureusement Camara Oumar pour l\'heureuse naissance de son fils le 28/01/2026. Que Dieu bénisse le nouveau-né et toute la famille !',
     '2026-01-28', 'publie', '2026-01-30 10:00:00')
ON DUPLICATE KEY UPDATE statut = VALUES(statut);

-- Annonce 3 : Réunion — publiée
INSERT INTO annonces (id, type_id, member_id, titre, contenu, date_evenement, statut, published_at) VALUES
    (3, 6, NULL,
     'Réunion ordinaire — 27 avril 2026',
     'Rappel : réunion ordinaire du mois d\'avril le dimanche 27/04/2026 à 18h30 au domicile de notre trésorier Koné Ibou. Ordre du jour : cotisations, prêts, préparation anniversaire. Soyez ponctuels !',
     '2026-04-27', 'publie', '2026-04-20 09:00:00')
ON DUPLICATE KEY UPDATE statut = VALUES(statut);

-- Annonce 4 : Décès — publiée
INSERT INTO annonces (id, type_id, member_id, titre, contenu, date_evenement, statut, published_at) VALUES
    (4, 2, @id11,
     'Décès de la mère de Touré Souleymane',
     'C\'est avec tristesse que nous apprenons le décès de la mère de notre frère Touré Souleymane (Solo). Les condoléances de toute la famille NAFA l\'accompagnent. Que son âme repose en paix.',
     '2026-02-15', 'publie', '2026-02-15 14:00:00')
ON DUPLICATE KEY UPDATE statut = VALUES(statut);

COMMIT;

-- Publier l'annonce mariage vers tous les membres (canal both)
CALL sp_publier_annonce(1, 'both', NULL, 1, @nb_sms, @nb_wa, @pub_msg);
SELECT @nb_sms AS 'SMS créés', @nb_wa AS 'WhatsApp créés', @pub_msg;

-- Publier l'annonce réunion uniquement par WhatsApp
CALL sp_publier_annonce(3, 'whatsapp', NULL, 1, @nb_sms2, @nb_wa2, @pub_msg2);

-- Simuler quelques envois réussis pour les annonces 2 et 4 (déjà publiées)
-- On insère directement les diffusions avec statut envoye
INSERT INTO diffusions (annonce_id, member_id, canal, telephone, statut, provider_ref) VALUES
    (2, @id1,  'whatsapp', '+224620100001', 'envoye', 'WA-2026-001'),
    (2, @id2,  'whatsapp', '+224620100002', 'envoye', 'WA-2026-002'),
    (2, @id3,  'sms',      '+224620100003', 'envoye', 'SM-2026-003'),
    (2, @id4,  'sms',      '+224620100004', 'envoye', 'SM-2026-004'),
    (2, @id5,  'whatsapp', '+224620100005', 'envoye', 'WA-2026-005'),
    (2, @id6,  'whatsapp', '+224620100006', 'envoye', 'WA-2026-006'),
    (2, @id7,  'sms',      '+224620100007', 'envoye', 'SM-2026-007'),
    (2, @id8,  'whatsapp', '+224620100008', 'echec',  NULL),
    (2, @id9,  'sms',      '+224620100009', 'envoye', 'SM-2026-009'),
    (2, @id10, 'whatsapp', '+224620100010', 'envoye', 'WA-2026-010'),
    (2, @id11, 'whatsapp', '+224620100011', 'envoye', 'WA-2026-011'),
    (2, @id12, 'sms',      '+224620100012', 'envoye', 'SM-2026-012'),
    (4, @id1,  'whatsapp', '+224620100001', 'envoye', 'WA-2026-041'),
    (4, @id2,  'whatsapp', '+224620100002', 'envoye', 'WA-2026-042'),
    (4, @id3,  'whatsapp', '+224620100003', 'envoye', 'WA-2026-043'),
    (4, @id4,  'sms',      '+224620100004', 'envoye', 'SM-2026-044'),
    (4, @id5,  'sms',      '+224620100005', 'echec',  NULL),
    (4, @id6,  'whatsapp', '+224620100006', 'envoye', 'WA-2026-046'),
    (4, @id7,  'sms',      '+224620100007', 'envoye', 'SM-2026-047'),
    (4, @id8,  'whatsapp', '+224620100008', 'envoye', 'WA-2026-048'),
    (4, @id9,  'sms',      '+224620100009', 'envoye', 'SM-2026-049'),
    (4, @id10, 'whatsapp', '+224620100010', 'envoye', 'WA-2026-050')
ON DUPLICATE KEY UPDATE statut = VALUES(statut);

COMMIT;

-- =============================================================================
-- PARAMÈTRES DE L'ASSOCIATION
-- =============================================================================
INSERT INTO parametres
    (id, nom_association, slogan, adresse, telephone, email_contact,
     montant_cotisation_mensuelle, devise, exercice_courant)
VALUES
    (1, 'Association Nafa',
     'Ensemble pour un avenir meilleur',
     'Quartier Ratoma, Conakry, Guinée',
     '+224 628 000 000',
     'contact@nafa.org',
     5000.00, 'FCFA', 2026)
ON DUPLICATE KEY UPDATE
    nom_association              = VALUES(nom_association),
    slogan                       = VALUES(slogan),
    adresse                      = VALUES(adresse),
    telephone                    = VALUES(telephone),
    email_contact                = VALUES(email_contact),
    montant_cotisation_mensuelle = VALUES(montant_cotisation_mensuelle),
    devise                       = VALUES(devise),
    exercice_courant             = VALUES(exercice_courant);

COMMIT;

-- =============================================================================
-- VÉRIFICATION FINALE
-- =============================================================================

SELECT '=== RÉSUMÉ ===' AS info;
SELECT COUNT(*) AS nb_membres          FROM members WHERE statut = 'actif';
SELECT COUNT(*) AS nb_contributions    FROM contributions;
SELECT COUNT(*) AS nb_prets            FROM loans;
SELECT COUNT(*) AS nb_evenements       FROM events;
SELECT COUNT(*) AS nb_annonces         FROM annonces;
SELECT COUNT(*) AS nb_diffusions       FROM diffusions;
SELECT solde    AS solde_caisse_2026   FROM caisse WHERE exercice = 2026;
SELECT COUNT(*) AS nb_mouvements_caisse FROM caisse_mouvements WHERE exercice = 2026;

SET foreign_key_checks = 1;
