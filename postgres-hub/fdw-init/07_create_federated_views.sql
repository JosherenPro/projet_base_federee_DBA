-- =============================================
-- VUE 1 : vue_client_complet
-- Profil client unifie avec score de risque, solde total et nombre de comptes
-- Sources : PG(client + compte) + MySQL(scoring)
-- =============================================
CREATE OR REPLACE VIEW vue_client_complet AS
SELECT
    c.id_client,
    c.nom,
    c.prenom,
    c.date_naissance,
    c.numero_piece,
    c.icf,
    c.telephone,
    c.email,
    c.adresse,
    a.nom AS agence_nom,
    a.ville AS agence_ville,
    COALESCE(compte_info.nb_comptes, 0) AS nombre_comptes,
    COALESCE(compte_info.solde_total, 0) AS solde_total,
    COALESCE(compte_info.solde_courant, 0) AS solde_courant,
    COALESCE(compte_info.solde_epargne, 0) AS solde_epargne,
    s.score AS score_risque,
    s.niveau_risque,
    s.date_evaluation AS date_dernier_scoring
FROM client c
JOIN agence a ON c.id_agence = a.id_agence
LEFT JOIN (
    SELECT
        id_client,
        COUNT(*) AS nb_comptes,
        SUM(CASE WHEN statut = 'actif' THEN solde ELSE 0 END) AS solde_total,
        SUM(CASE WHEN type_compte = 'courant' AND statut = 'actif' THEN solde ELSE 0 END) AS solde_courant,
        SUM(CASE WHEN type_compte = 'epargne' AND statut = 'actif' THEN solde ELSE 0 END) AS solde_epargne
    FROM compte
    WHERE statut = 'actif'
    GROUP BY id_client
) compte_info ON c.id_client = compte_info.id_client
LEFT JOIN LATERAL (
    SELECT score, niveau_risque, date_evaluation
    FROM fdw_scoring
    WHERE fdw_scoring.icf = c.icf
    ORDER BY date_evaluation DESC
    LIMIT 1
) s ON true;

-- =============================================
-- VUE 2 : vue_credit_detail
-- Detail complet d'un dossier de credit avec garanties et echeancier
-- Sources : PG(client) + MySQL(dossier_credit + echeancier + garantie)
-- =============================================
CREATE OR REPLACE VIEW vue_credit_detail AS
SELECT
    dc.id_dossier,
    dc.montant_demande,
    dc.montant_accorde,
    dc.duree_mois,
    dc.taux,
    dc.statut AS statut_credit,
    dc.date_soumission,
    dc.date_decision,
    dc.motif_rejet,
    dc.icf,
    c.nom AS client_nom,
    c.prenom AS client_prenom,
    a.nom AS agence_nom,
    e.nom AS agent_nom,
    e.prenom AS agent_prenom,
    COALESCE(garantie_info.nb_garanties, 0) AS nombre_garanties,
    COALESCE(garantie_info.valeur_totale_garanties, 0) AS valeur_totale_garanties,
    COALESCE(echeance_info.nb_echeances, 0) AS nombre_echeances,
    COALESCE(echeance_info.montant_total_restant, 0) AS montant_total_restant,
    COALESCE(echeance_info.nb_echeances_impayees, 0) AS nombre_echeances_impayees
FROM fdw_dossier_credit dc
LEFT JOIN client c ON dc.icf = c.icf
LEFT JOIN agence a ON c.id_agence = a.id_agence
LEFT JOIN employe e ON dc.id_agent = e.id_employe
LEFT JOIN LATERAL (
    SELECT
        COUNT(*) AS nb_garanties,
        SUM(valeur_estimee) AS valeur_totale_garanties
    FROM fdw_garantie
    WHERE fdw_garantie.id_dossier = dc.id_dossier
) garantie_info ON true
LEFT JOIN LATERAL (
    SELECT
        COUNT(*) AS nb_echeances,
        SUM(CASE WHEN statut_paiement != 'paid' THEN montant_capital + montant_interet ELSE 0 END) AS montant_total_restant,
        SUM(CASE WHEN statut_paiement = 'overdue' THEN 1 ELSE 0 END) AS nb_echeances_impayees
    FROM fdw_echeancier
    WHERE fdw_echeancier.id_dossier = dc.id_dossier
) echeance_info ON true;

-- =============================================
-- VUE 3 : vue_operation_comptable
-- Operations bancaires avec ecritures comptables associees
-- Sources : PG(transaction) + SQL Server(ecriture_comptable + plan_comptable)
-- =============================================
CREATE OR REPLACE VIEW vue_operation_comptable AS
SELECT
    t.id_transaction,
    t.type_operation,
    t.montant,
    t.devise,
    t.date_heure,
    csolde.type_compte AS type_compte_source,
    cdest.type_compte AS type_compte_dest,
    ec.id_ecriture,
    TO_DATE(ec.date_ecriture, 'Mon DD YYYY HH12:MI:SS:AM') AS date_ecriture,
    ec.libelle AS libelle_ecriture,
    ec.debit,
    ec.credit,
    ec.journal,
    pc.numero_compte,
    pc.libelle AS libelle_compte,
    pc.classe_compte
FROM transaction t
LEFT JOIN compte csolde ON t.id_compte_source = csolde.id_compte
LEFT JOIN compte cdest ON t.id_compte_dest = cdest.id_compte
LEFT JOIN fdw_ecriture_comptable ec ON ec.id_agence = COALESCE(csolde.id_agence, cdest.id_agence)
    AND TO_DATE(ec.date_ecriture, 'Mon DD YYYY HH12:MI:SS:AM') = t.date_heure::DATE
LEFT JOIN fdw_plan_comptable pc ON ec.numero_compte = pc.numero_compte;

-- =============================================
-- VUE 4 : vue_tableau_bord
-- Indicateurs cles par agence : volume credits, encaisse, nombre de comptes actifs
-- Sources : PG(agence + compte) + MySQL(dossier_credit) + SQL Server(operation_agence)
-- =============================================
CREATE OR REPLACE VIEW vue_tableau_bord AS
SELECT
    a.id_agence,
    a.nom AS agence_nom,
    a.ville AS agence_ville,
    a.code_agence,
    COALESCE(compte_info.nb_comptes_actifs, 0) AS nombre_comptes_actifs,
    COALESCE(compte_info.solde_total, 0) AS solde_total_comptes,
    COALESCE(credit_info.nb_credits_approuves, 0) AS nombre_credits_approuves,
    COALESCE(credit_info.volume_credits, 0) AS volume_total_credits,
    COALESCE(credit_info.nb_credits_en_cours, 0) AS nombre_credits_en_cours,
    COALESCE(op_info.nb_operations, 0) AS nombre_operations_agence,
    COALESCE(op_info.volume_operations, 0) AS volume_operations
FROM agence a
LEFT JOIN (
    SELECT
        id_agence,
        COUNT(*) AS nb_comptes_actifs,
        SUM(solde) AS solde_total
    FROM compte
    WHERE statut = 'actif'
    GROUP BY id_agence
) compte_info ON a.id_agence = compte_info.id_agence
LEFT JOIN LATERAL (
    SELECT
        COUNT(*) FILTER (WHERE statut = 'approuve') AS nb_credits_approuves,
        SUM(montant_accorde) FILTER (WHERE statut = 'approuve') AS volume_credits,
        COUNT(*) FILTER (WHERE statut = 'en_cours') AS nb_credits_en_cours
    FROM fdw_dossier_credit dc
    WHERE dc.icf IN (SELECT icf FROM client WHERE id_agence = a.id_agence)
) credit_info ON true
LEFT JOIN LATERAL (
    SELECT
        COUNT(*) AS nb_operations,
        SUM(montant) AS volume_operations
    FROM fdw_operation_agence
    WHERE fdw_operation_agence.id_agence = a.id_agence
) op_info ON true;
