-- =============================================================================
-- Nafa — Jeu de données de démonstration
-- Exécuter après 01_schema.sql et 02_procedures.sql
-- Contexte : Association Espoir Solidarité (Cocody, Abidjan, Côte d'Ivoire)
--            Créée le 01/04/2026 — activités démarrées le 01/07/2026
--            État au 02 août 2026
-- =============================================================================

SET NAMES utf8mb4;
SET foreign_key_checks = 0;

-- Désactiver l'autocommit global pour ce script
SET autocommit = 0;

-- =============================================================================
-- PARAMÈTRES DE L'ASSOCIATION
-- (renseignés en premier : sp_upsert_member lit montant_adhesion/exercice_courant
--  à l'insertion de chaque membre, et sp_get_monthly_pivot lit date_debut_cotisations)
-- =============================================================================
INSERT INTO parametres
    (id, nom_association, slogan, adresse, telephone, email_contact,
     date_creation, date_debut_activite, numero_enregistrement,
     montant_cotisation_mensuelle, montant_adhesion, devise,
     plafond_pret, taux_interet_pret, exercice_courant,
     date_debut_cotisations, tenir_compte_date_adhesion)
VALUES
    (1, 'Association Espoir Solidarité',
     'L''union fait la force',
     'Cocody, Abidjan, Côte d''Ivoire',
     '+225 07 01 02 03 00',
     'contact@espoirsolidarite.ci',
     '2026-04-01', '2026-07-01', 'RCI-ONG-2026-0458',
     5000.00, 2000.00, 'FCFA',
     200000.00, 5.00, 2026,
     '2026-07-01', 1)
ON DUPLICATE KEY UPDATE
    nom_association              = VALUES(nom_association),
    slogan                       = VALUES(slogan),
    adresse                      = VALUES(adresse),
    telephone                    = VALUES(telephone),
    email_contact                = VALUES(email_contact),
    date_creation                = VALUES(date_creation),
    date_debut_activite          = VALUES(date_debut_activite),
    numero_enregistrement        = VALUES(numero_enregistrement),
    montant_cotisation_mensuelle = VALUES(montant_cotisation_mensuelle),
    montant_adhesion             = VALUES(montant_adhesion),
    devise                       = VALUES(devise),
    plafond_pret                 = VALUES(plafond_pret),
    taux_interet_pret            = VALUES(taux_interet_pret),
    exercice_courant             = VALUES(exercice_courant),
    date_debut_cotisations       = VALUES(date_debut_cotisations),
    tenir_compte_date_adhesion   = VALUES(tenir_compte_date_adhesion);

COMMIT;

-- =============================================================================
-- UTILISATEURS SYSTÈME
-- Mot de passe pour tous : "password"
-- Hash bcrypt Laravel : $2y$10$FcrXxMsGKqmCrCDDNDHS6ufWEDlJvInBIiTrVPUMKfW5ARPdnbZeO
-- =============================================================================

INSERT INTO users (id, name, email, password, role_id, member_id, is_active) VALUES
    (1, 'Administrateur',           'admin@nafa.sn',      '$2y$10$FcrXxMsGKqmCrCDDNDHS6ufWEDlJvInBIiTrVPUMKfW5ARPdnbZeO', 1, NULL, 1),
    (2, 'N''Guessan Kouamé Patrick','tresorier@nafa.sn',  '$2y$10$FcrXxMsGKqmCrCDDNDHS6ufWEDlJvInBIiTrVPUMKfW5ARPdnbZeO', 2, NULL, 1),
    (3, 'Aya Christelle Konan',     'secretaire@nafa.sn', '$2y$10$FcrXxMsGKqmCrCDDNDHS6ufWEDlJvInBIiTrVPUMKfW5ARPdnbZeO', 3, NULL, 1),
    (4, 'Lecteur',                  'lecteur@nafa.sn',    '$2y$10$FcrXxMsGKqmCrCDDNDHS6ufWEDlJvInBIiTrVPUMKfW5ARPdnbZeO', 4, NULL, 1),
    (5, 'Ouattara Mamadou',         'membre@nafa.sn',     '$2y$10$FcrXxMsGKqmCrCDDNDHS6ufWEDlJvInBIiTrVPUMKfW5ARPdnbZeO', 5, NULL, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

COMMIT;

-- =============================================================================
-- CAISSE — apport initial des membres fondateurs (01/04/2026)
-- =============================================================================

INSERT INTO caisse (exercice, solde) VALUES (2026, 40000.00)
ON DUPLICATE KEY UPDATE solde = 40000.00;

INSERT INTO caisse_mouvements
    (exercice, type, type_recette, categorie_id, montant, solde_apres, reference_id, libelle, created_by)
VALUES
    (2026, 'credit', 'don', NULL, 40000.00, 40000.00, NULL, 'Apport initial des 4 membres fondateurs — constitution de l''association', 1);

COMMIT;

-- =============================================================================
-- MEMBRES  (via sp_upsert_member)
-- Paramètres : nom, prenom, alias, telephone, telephone2, email, date_adhesion,
--              role_id, statut, lieu_habitation, emploi, commentaires,
--              member_id(NULL=INSERT), user_id
-- =============================================================================

-- 1. Kouassi Yao Éric — Président — membre fondateur
CALL sp_upsert_member('Kouassi','Yao Éric','Éric',      '+2250701020301',NULL,'eric.kouassi@espoirsolidarite.ci',      '2026-04-01', 1, 'actif', 'Cocody, Abidjan',     'Enseignant',      NULL, NULL, 1, @id1, @mat1, @msg1);
-- 2. Adjoua Béatrice Koffi — Vice-Présidente — membre fondatrice
CALL sp_upsert_member('Adjoua','Béatrice','Béa',        '+2250701020302',NULL,'beatrice.adjoua@espoirsolidarite.ci',   '2026-04-01', 2, 'actif', 'Marcory, Abidjan',    'Infirmière',      NULL, NULL, 1, @id2, @mat2, @msg2);
-- 3. N'Guessan Kouamé Patrick — Trésorier — membre fondateur
CALL sp_upsert_member('N''Guessan','Kouamé Patrick','Patrick','+2250701020303',NULL,'patrick.nguessan@espoirsolidarite.ci','2026-04-01', 3, 'actif', 'Cocody, Abidjan', 'Comptable',       NULL, NULL, 1, @id3, @mat3, @msg3);
-- 4. Aya Christelle Konan — Secrétaire — membre fondatrice
CALL sp_upsert_member('Aya','Christelle Konan','Chris', '+2250701020304',NULL,'christelle.aya@espoirsolidarite.ci',    '2026-04-01', 4, 'actif', 'Yopougon, Abidjan',   'Commerçante',     NULL, NULL, 1, @id4, @mat4, @msg4);
-- 5. Ouattara Mamadou — Membre
CALL sp_upsert_member('Ouattara','Mamadou',NULL,        '+2250701020305',NULL,'mamadou.ouattara@espoirsolidarite.ci',  '2026-04-15', 5, 'actif', 'Abobo, Abidjan',      'Chauffeur',       NULL, NULL, 1, @id5, @mat5, @msg5);
-- 6. Bamba Fatoumata (Fanta) — Membre
CALL sp_upsert_member('Bamba','Fatoumata','Fanta',      '+2250701020306',NULL,'fatoumata.bamba@espoirsolidarite.ci',   '2026-04-15', 5, 'actif', 'Yopougon, Abidjan',   'Couturière',      NULL, NULL, 1, @id6, @mat6, @msg6);
-- 7. Coulibaly Ibrahim (Ibro) — Membre
CALL sp_upsert_member('Coulibaly','Ibrahim','Ibro',     '+2250701020307',NULL,'ibrahim.coulibaly@espoirsolidarite.ci', '2026-05-10', 5, 'actif', 'Koumassi, Abidjan',   'Électricien',     NULL, NULL, 1, @id7, @mat7, @msg7);
-- 8. Yeo Awa — Membre
CALL sp_upsert_member('Yeo','Awa',NULL,                 '+2250701020308',NULL,'awa.yeo@espoirsolidarite.ci',           '2026-05-10', 5, 'actif', 'Treichville, Abidjan','Coiffeuse',       NULL, NULL, 1, @id8, @mat8, @msg8);
-- 9. Diaby Souleymane (Solo) — Membre
CALL sp_upsert_member('Diaby','Souleymane','Solo',      '+2250701020309',NULL,'souleymane.diaby@espoirsolidarite.ci',  '2026-06-01', 5, 'actif', 'Adjamé, Abidjan',     'Commerçant',      NULL, NULL, 1, @id9, @mat9, @msg9);
-- 10. Kouamé Affoué Rachel — Membre (adhésion mi-juillet, après le début des cotisations)
CALL sp_upsert_member('Kouamé','Affoué Rachel','Rachel','+2250701020310',NULL,'affoue.kouame@espoirsolidarite.ci',     '2026-07-15', 5, 'actif', 'Cocody, Abidjan',     'Étudiante',       NULL, NULL, 1, @id10,@mat10,@msg10);
-- 11. Bakayoko Aminata (Amina) — Membre (adhésion début août, membre le plus récent)
CALL sp_upsert_member('Bakayoko','Aminata','Amina',     '+2250701020311',NULL,'aminata.bakayoko@espoirsolidarite.ci',  '2026-08-01', 5, 'actif', 'Marcory, Abidjan',    'Secrétaire',      NULL, NULL, 1, @id11,@mat11,@msg11);
-- 12. Koffi Jean-Baptiste — Auditeur — membre fondateur
CALL sp_upsert_member('Koffi','Jean-Baptiste',NULL,     '+2250701020312',NULL,'jeanbaptiste.koffi@espoirsolidarite.ci','2026-04-01', 6, 'actif', 'Plateau, Abidjan',    'Expert-comptable',NULL, NULL, 1, @id12,@mat12,@msg12);
-- 13. Traoré Salimata — Membre inactif
CALL sp_upsert_member('Traoré','Salimata',NULL,         '+2250701020313',NULL,NULL,                                    '2026-05-01', 5, 'inactif','Port-Bouët, Abidjan', 'Ménagère',        NULL, NULL, 1, @id13,@mat13,@msg13);

-- Lier les utilisateurs à leurs membres
UPDATE users SET member_id = @id3 WHERE id = 2;  -- trésorier → N'Guessan Kouamé Patrick
UPDATE users SET member_id = @id4 WHERE id = 3;  -- secrétaire → Aya Christelle Konan
UPDATE users SET member_id = @id5 WHERE id = 5;  -- membre demo → Ouattara Mamadou

COMMIT;

-- Vérification matricules
SELECT @mat1 AS 'MBR-01', @mat2 AS 'MBR-02', @mat3 AS 'MBR-03',
       @mat4 AS 'MBR-04', @mat5 AS 'MBR-05', @mat6 AS 'MBR-06';

-- =============================================================================
-- DONS
-- =============================================================================

CALL sp_record_don(@id1, NULL, NULL, 20000.00, '2026-07-01',
    'Contribution volontaire du Président pour le lancement des activités', 1,
    @don1_id, @don1_recu, @don1_msg);

CALL sp_record_don(NULL, NULL, 'Pharmacie Les Palmiers', 50000.00, '2026-07-05',
    'Soutien au lancement de l''association', 1,
    @don2_id, @don2_recu, @don2_msg);

COMMIT;
SELECT @don1_recu AS 'Don 1', @don2_recu AS 'Don 2';

-- =============================================================================
-- COTISATIONS MENSUELLES (5 000 FCFA/mois/membre)
-- Les cotisations démarrent le 01/07/2026 (date_debut_cotisations).
-- tenir_compte_date_adhesion = 1 : pour Rachel (adhésion 15/07) et Amina (adhésion
-- 01/08), le seuil individuel s'applique — juillet reste dû pour Rachel (même mois
-- que son adhésion) mais est exclu ('na') pour Amina.
-- Juillet → 10 payés/partiels, 1 impayé (Solo)
-- Août    → mois en cours (2 jours écoulés) : seul le trésorier et le président
--           ont déjà réglé, le reste est encore en attente
-- =============================================================================

-- ---- JUILLET 2026 ----
CALL sp_pay_contribution(@id1,  2026, 7, 5000.00, 5000.00, 1, @r, @s, @m);
CALL sp_pay_contribution(@id2,  2026, 7, 5000.00, 5000.00, 1, @r, @s, @m);
CALL sp_pay_contribution(@id3,  2026, 7, 5000.00, 5000.00, 2, @r, @s, @m);
CALL sp_pay_contribution(@id4,  2026, 7, 5000.00, 5000.00, 3, @r, @s, @m);
CALL sp_pay_contribution(@id5,  2026, 7, 5000.00, 5000.00, 1, @r, @s, @m);
CALL sp_pay_contribution(@id6,  2026, 7, 5000.00, 5000.00, 1, @r, @s, @m);
-- Partiel juillet
CALL sp_pay_contribution(@id7,  2026, 7, 2500.00, 5000.00, 1, @r, @s, @m);
CALL sp_pay_contribution(@id8,  2026, 7, 5000.00, 5000.00, 1, @r, @s, @m);
-- @id9 (Solo) : impayé juillet (aucun appel)
CALL sp_pay_contribution(@id10, 2026, 7, 5000.00, 5000.00, 1, @r, @s, @m);
CALL sp_pay_contribution(@id12, 2026, 7, 5000.00, 5000.00, 1, @r, @s, @m);
-- @id11 (Amina) : adhésion 01/08, juillet exclu automatiquement (statut 'na')

-- ---- AOÛT 2026 (mois en cours) ----
CALL sp_pay_contribution(@id1,  2026, 8, 5000.00, 5000.00, 1, @r, @s, @m);
CALL sp_pay_contribution(@id3,  2026, 8, 5000.00, 5000.00, 2, @r, @s, @m);
-- Reste des membres actifs : encore en attente pour août (mois tout juste commencé)

COMMIT;

-- =============================================================================
-- PRÊTS
-- =============================================================================

-- Prêt 1 : Ouattara Mamadou — 100 000 FCFA / 5% / 12 mois — débuté au lancement (01/07/2026)
CALL sp_generate_loan_schedule(@id5, 100000.00, 5.00, 12, '2026-07-01', 1,
    @loan1_id, @loan1_m, @loan1_msg);
SELECT @loan1_id AS 'Prêt 1 ID', @loan1_m AS 'Mensualité', @loan1_msg;

-- 1ère échéance payée (juillet)
UPDATE loan_schedule
SET statut = 'paid'
WHERE loan_id = @loan1_id AND numero_echeance = 1;

COMMIT;

-- =============================================================================
-- ÉVÉNEMENTS
-- =============================================================================

INSERT INTO events (id, type_id, titre, description, date_debut, date_fin, lieu, statut, created_by) VALUES
    (1, 1, 'Assemblée Générale Constitutive',
     'Constitution officielle de l''association, adoption des statuts et élection du bureau.',
     '2026-04-01 09:00:00', '2026-04-01 13:00:00', 'Salle municipale de Cocody, Abidjan',
     'termine', 1),

    (2, 2, 'Réunion de lancement des activités',
     'Démarrage officiel des activités de l''association : cotisations, règlement intérieur, calendrier.',
     '2026-07-01 18:00:00', '2026-07-01 20:00:00', 'Foyer des jeunes de Cocody, Abidjan',
     'termine', 1),

    (3, 2, 'Réunion ordinaire d''août 2026',
     'Point sur les cotisations de juillet, suivi du prêt en cours, divers.',
     '2026-08-24 18:30:00', '2026-08-24 20:30:00', 'Domicile du trésorier, Cocody, Abidjan',
     'planifie', 2),

    (4, 1, 'Assemblée Générale Ordinaire — Bilan du 1er trimestre',
     'Bilan des trois premiers mois d''activité, situation financière et perspectives.',
     '2026-10-15 09:00:00', '2026-10-15 13:00:00', 'Salle municipale de Cocody, Abidjan',
     'planifie', 1)

ON DUPLICATE KEY UPDATE titre = VALUES(titre);

-- Participants à l'AG constitutive (événement 1 — seuls les 5 fondateurs existaient)
INSERT INTO event_participants (event_id, member_id, statut) VALUES
    (1, @id1,  'present'),
    (1, @id2,  'present'),
    (1, @id3,  'present'),
    (1, @id4,  'present'),
    (1, @id12, 'present')
ON DUPLICATE KEY UPDATE statut = VALUES(statut);

-- Participants à la réunion de lancement (événement 2 — membres déjà inscrits au 01/07)
INSERT INTO event_participants (event_id, member_id, statut) VALUES
    (2, @id1,  'present'),
    (2, @id2,  'present'),
    (2, @id3,  'present'),
    (2, @id4,  'present'),
    (2, @id5,  'present'),
    (2, @id6,  'present'),
    (2, @id7,  'absent'),
    (2, @id8,  'present'),
    (2, @id9,  'present'),
    (2, @id12, 'present')
ON DUPLICATE KEY UPDATE statut = VALUES(statut);

COMMIT;

-- =============================================================================
-- COTISATIONS EXCEPTIONNELLES — Frais de lancement (Event 2)
-- =============================================================================

CALL sp_create_cotisation_exceptionnelle(
    NULL, 2, NULL, 'Participation frais de lancement (collation, sono)', 3000.00, '2026-07-15', 1,
    @cex_nb, @cex_msg);
SELECT @cex_nb AS 'Nb CEX créées', @cex_msg;

-- Payer quelques membres
SELECT id INTO @cex1 FROM cotisations_exceptionnelles WHERE member_id = @id1  AND libelle LIKE '%lancement%' LIMIT 1;
SELECT id INTO @cex3 FROM cotisations_exceptionnelles WHERE member_id = @id3  AND libelle LIKE '%lancement%' LIMIT 1;
SELECT id INTO @cex4 FROM cotisations_exceptionnelles WHERE member_id = @id4  AND libelle LIKE '%lancement%' LIMIT 1;
SELECT id INTO @cex12 FROM cotisations_exceptionnelles WHERE member_id = @id12 AND libelle LIKE '%lancement%' LIMIT 1;
SELECT id INTO @cex2 FROM cotisations_exceptionnelles WHERE member_id = @id2  AND libelle LIKE '%lancement%' LIMIT 1;

CALL sp_pay_cotisation_exceptionnelle(@cex1,  3000.00, 1, @r, @s, @m);
CALL sp_pay_cotisation_exceptionnelle(@cex3,  3000.00, 2, @r, @s, @m);
CALL sp_pay_cotisation_exceptionnelle(@cex4,  3000.00, 3, @r, @s, @m);
CALL sp_pay_cotisation_exceptionnelle(@cex12, 3000.00, 1, @r, @s, @m);
CALL sp_pay_cotisation_exceptionnelle(@cex2,  1500.00, 1, @r, @s, @m);  -- paiement partiel

COMMIT;

-- =============================================================================
-- DÉPENSES
-- =============================================================================

-- Frais d'enregistrement légal de l'association
CALL sp_record_depense(6, NULL, 'Frais d''enregistrement légal de l''association', 25000.00,
    '2026-04-05', 'Direction des Affaires Administratives', 'RECEP-2026-0458', 1,
    @dep1_id, @dep1_msg);

-- Fournitures et registres pour l'AG constitutive
CALL sp_record_depense(1, 1, 'Fournitures et registres — AG constitutive', 15000.00,
    '2026-04-01', 'Papeterie Star Cocody', 'FAC-2026-0087', 1,
    @dep2_id, @dep2_msg);

-- Communication autour du lancement
CALL sp_record_depense(3, 2, 'Impression flyers et communication lancement', 8000.00,
    '2026-06-25', 'Imprimerie Rapide Plateau', 'REC-118', 1,
    @dep3_id, @dep3_msg);

-- Location sono et collation — réunion de lancement
CALL sp_record_depense(4, 2, 'Location sono et rafraîchissements — lancement', 45000.00,
    '2026-07-01', 'Traiteur Chez Rose', 'FACT-CR-2026-014', 1,
    @dep4_id, @dep4_msg);

-- Frais de déplacement du trésorier (collecte des cotisations)
CALL sp_record_depense(2, NULL, 'Frais de déplacement trésorier — collecte cotisations juillet', 5000.00,
    '2026-07-20', 'N''Guessan Kouamé Patrick', NULL, 1,
    @dep5_id, @dep5_msg);

COMMIT;
SELECT @dep1_msg, @dep2_msg, @dep3_msg, @dep4_msg, @dep5_msg;

-- =============================================================================
-- ANNONCES
-- =============================================================================

-- types_annonce IDs : 1=Mariage, 2=Décès, 3=Baptême, 4=Naissance, 5=Anniversaire,
--                     6=Réunion, 7=Autre

-- Annonce 1 : Lancement officiel — publiée
INSERT INTO annonces (id, type_id, member_id, titre, contenu, date_evenement, statut, published_at) VALUES
    (1, 6, NULL,
     'Lancement officiel des activités — 1er juillet 2026',
     'Chers membres, l''association Espoir Solidarité démarre officiellement ses activités le mercredi 01/07/2026 au Foyer des jeunes de Cocody. Cotisations, règlement intérieur et calendrier seront présentés. Votre présence est vivement souhaitée !',
     '2026-07-01', 'publie', '2026-06-25 09:00:00')
ON DUPLICATE KEY UPDATE statut = VALUES(statut);

-- Annonce 2 : Naissance — publiée
INSERT INTO annonces (id, type_id, member_id, titre, contenu, date_evenement, statut, published_at) VALUES
    (2, 4, @id6,
     'Naissance chez la famille Bamba',
     'L''association Espoir Solidarité félicite chaleureusement Bamba Fatoumata (Fanta) pour l''heureuse naissance survenue le 20/07/2026. Que Dieu bénisse le nouveau-né et toute la famille !',
     '2026-07-20', 'publie', '2026-07-21 10:00:00')
ON DUPLICATE KEY UPDATE statut = VALUES(statut);

-- Annonce 3 : Mariage — à diffuser
INSERT INTO annonces (id, type_id, member_id, titre, contenu, date_evenement, statut) VALUES
    (3, 1, @id8,
     'Mariage de Yeo Awa',
     'Chers membres, notre sœur Yeo Awa célèbre son mariage le 12/09/2026 à Abidjan. Votre présence et soutien sont les bienvenus. — Espoir Solidarité',
     '2026-09-12', 'brouillon')
ON DUPLICATE KEY UPDATE statut = 'brouillon';

-- Annonce 4 : Rappel AG bilan trimestriel — brouillon (pas encore diffusée)
INSERT INTO annonces (id, type_id, member_id, titre, contenu, date_evenement, statut) VALUES
    (4, 6, NULL,
     'Assemblée Générale Ordinaire — Bilan du 1er trimestre',
     'Rappel : Assemblée Générale Ordinaire le jeudi 15/10/2026 à 9h, Salle municipale de Cocody. Ordre du jour : bilan financier, cotisations, perspectives.',
     '2026-10-15', 'brouillon')
ON DUPLICATE KEY UPDATE statut = 'brouillon';

COMMIT;

-- Publier l'annonce de lancement vers tous les membres (canal both)
CALL sp_publier_annonce(1, 'both', NULL, 1, @nb_sms, @nb_wa, @pub_msg);
SELECT @nb_sms AS 'SMS créés', @nb_wa AS 'WhatsApp créés', @pub_msg;

-- Simuler quelques envois réussis pour l'annonce 2 (déjà publiée)
INSERT INTO diffusions (annonce_id, member_id, canal, telephone, statut, provider_ref) VALUES
    (2, @id1,  'whatsapp', '+2250701020301', 'envoye', 'WA-2026-001'),
    (2, @id2,  'whatsapp', '+2250701020302', 'envoye', 'WA-2026-002'),
    (2, @id3,  'sms',      '+2250701020303', 'envoye', 'SM-2026-003'),
    (2, @id4,  'sms',      '+2250701020304', 'envoye', 'SM-2026-004'),
    (2, @id5,  'whatsapp', '+2250701020305', 'envoye', 'WA-2026-005'),
    (2, @id7,  'sms',      '+2250701020307', 'envoye', 'SM-2026-007'),
    (2, @id8,  'whatsapp', '+2250701020308', 'echec',  NULL),
    (2, @id9,  'sms',      '+2250701020309', 'envoye', 'SM-2026-009'),
    (2, @id10, 'whatsapp', '+2250701020310', 'envoye', 'WA-2026-010'),
    (2, @id12, 'sms',      '+2250701020312', 'envoye', 'SM-2026-012')
ON DUPLICATE KEY UPDATE statut = VALUES(statut);

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
