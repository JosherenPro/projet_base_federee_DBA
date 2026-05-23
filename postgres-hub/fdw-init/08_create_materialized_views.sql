-- Vue materialisee pour le tableau de bord (performance)
CREATE MATERIALIZED VIEW mv_tableau_bord AS
SELECT * FROM vue_tableau_bord;

-- Index sur la vue materialisee
CREATE UNIQUE INDEX idx_mv_tableau_bord_agence ON mv_tableau_bord(id_agence);

-- Vue materialisee pour les clients a risque eleve
CREATE MATERIALIZED VIEW mv_clients_risque_eleve AS
SELECT
    c.id_client,
    c.nom,
    c.prenom,
    c.icf,
    c.telephone,
    c.email,
    a.nom AS agence_nom,
    s.score,
    s.niveau_risque,
    s.date_evaluation
FROM client c
JOIN agence a ON c.id_agence = a.id_agence
JOIN fdw_scoring s ON c.icf = s.icf
WHERE s.niveau_risque IN ('eleve', 'tres_eleve')
ORDER BY s.score ASC;

CREATE INDEX idx_mv_risque_icf ON mv_clients_risque_eleve(icf);

-- Fonction de rafraichissement automatique
CREATE OR REPLACE FUNCTION rafraichir_vues_materialisees()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_tableau_bord;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_clients_risque_eleve;
    RAISE NOTICE 'Vues materialisees rafraichies avec succes a %', NOW();
END;
$$ LANGUAGE plpgsql;
