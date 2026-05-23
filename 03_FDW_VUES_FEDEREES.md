# PROMPT 03 - Foreign Data Wrappers & Vues Federees

## OBJECTIF

Configurer les Foreign Data Wrappers (FDW) dans PostgreSQL pour interconnecter les bases MySQL et SQL Server, creer les foreign tables, les tables de mapping inter-schemas, et les 4 vues federees qui constituent le coeur fonctionnel du systeme.

## PRE-REQUIS

Les prompts `01_ARCHITECTURE_DOCKER.md` et `02_MODELISATION_BDD.md` ont ete executes. Les trois bases de donnees sont configurees avec leurs tables et donnees de seed.

---

## PARTIE A : Configuration des serveurs FDW

### Fichier : `postgres-hub/init/04_create_fdw_servers.sql`

```sql
-- =============================================
-- Configuration des serveurs distants FDW
-- =============================================

-- 1. Creer les extensions FDW (si pas deja fait)
CREATE EXTENSION IF NOT EXISTS mysql_fdw;
CREATE EXTENSION IF NOT EXISTS tds_fdw;

-- 2. Creer le serveur MySQL distant
CREATE SERVER mysql_server
    FOREIGN DATA WRAPPER mysql_fdw
    OPTIONS (
        host 'mysql-credit',
        port '3306',
        dbname 'banque_credit'
    );

-- 3. Creer le user mapping pour MySQL
CREATE USER MAPPING FOR banque_admin
    SERVER mysql_server
    OPTIONS (
        username 'fdw_user',
        password 'FdwT0g0!2025'
    );

-- 4. Creer le serveur SQL Server distant
CREATE SERVER mssql_server
    FOREIGN DATA WRAPPER tds_fdw
    OPTIONS (
        servername 'mssql-compta',
        port '1433',
        database 'banque_compta',
        tds_version '7.3'
    );

-- 5. Creer le user mapping pour SQL Server
CREATE USER MAPPING FOR banque_admin
    SERVER mssql_server
    OPTIONS (
        username 'fdw_user',
        password 'FdwMssqlT0g0!'
    );
```

---

## PARTIE B : Creation des Foreign Tables

### Fichier : `postgres-hub/init/05_create_foreign_tables.sql`

Creer des foreign tables qui refletent les tables des bases distantes. Ces tables se comportent comme des tables locales pour les requetes SQL.

```sql
-- =============================================
-- Foreign Tables depuis MySQL (Credits & Risque)
-- =============================================

CREATE FOREIGN TABLE fdw_dossier_credit (
    id_dossier INTEGER,
    montant_demande NUMERIC(15,2),
    montant_accorde NUMERIC(15,2),
    duree_mois INTEGER,
    taux NUMERIC(5,2),
    statut VARCHAR(20),
    icf CHAR(64),
    id_agent INTEGER,
    date_soumission TIMESTAMP,
    date_decision TIMESTAMP,
    motif_rejet TEXT
)
SERVER mysql_server
OPTIONS (table_name 'dossier_credit');

CREATE FOREIGN TABLE fdw_garantie (
    id_garantie INTEGER,
    type_garantie VARCHAR(50),
    valeur_estimee NUMERIC(15,2),
    description TEXT,
    id_dossier INTEGER,
    date_evaluation DATE
)
SERVER mysql_server
OPTIONS (table_name 'garantie');

CREATE FOREIGN TABLE fdw_echeancier (
    id_echeance INTEGER,
    date_echeance DATE,
    montant_capital NUMERIC(15,2),
    montant_interet NUMERIC(15,2),
    statut_paiement VARCHAR(20),
    date_paiement_effectif DATE,
    id_dossier INTEGER
)
SERVER mysql_server
OPTIONS (table_name 'echeancier');

CREATE FOREIGN TABLE fdw_scoring (
    id_scoring INTEGER,
    score INTEGER,
    niveau_risque VARCHAR(20),
    date_evaluation TIMESTAMP,
    icf CHAR(64),
    commentaire TEXT
)
SERVER mysql_server
OPTIONS (table_name 'scoring');

-- =============================================
-- Foreign Tables depuis SQL Server (Comptabilite & RH)
-- =============================================

CREATE FOREIGN TABLE fdw_ecriture_comptable (
    id_ecriture INTEGER,
    date_ecriture DATE,
    libelle VARCHAR(255),
    debit NUMERIC(18,2),
    credit NUMERIC(18,2),
    numero_compte VARCHAR(10),
    journal VARCHAR(50),
    id_agence INTEGER,
    piece_justificative VARCHAR(100),
    date_saisie TIMESTAMP
)
SERVER mssql_server
OPTIONS (schema_name 'dbo', table_name 'ecriture_comptable');

CREATE FOREIGN TABLE fdw_plan_comptable (
    numero_compte VARCHAR(10),
    libelle VARCHAR(200),
    classe_compte INTEGER,
    sous_classe VARCHAR(100)
)
SERVER mssql_server
OPTIONS (schema_name 'dbo', table_name 'plan_comptable');

CREATE FOREIGN TABLE fdw_bulletin_paie (
    id_bulletin INTEGER,
    mois INTEGER,
    annee INTEGER,
    salaire_brut NUMERIC(18,2),
    salaire_net NUMERIC(18,2),
    net_a_payer NUMERIC(18,2),
    id_employe INTEGER,
    id_agence INTEGER,
    date_emission TIMESTAMP
)
SERVER mssql_server
OPTIONS (schema_name 'dbo', table_name 'bulletin_paie');

CREATE FOREIGN TABLE fdw_operation_agence (
    id_operation INTEGER,
    type_operation VARCHAR(50),
    montant NUMERIC(18,2),
    devise VARCHAR(3),
    date_operation TIMESTAMP,
    id_agence INTEGER,
    id_employe INTEGER,
    description VARCHAR(500)
)
SERVER mssql_server
OPTIONS (schema_name 'dbo', table_name 'operation_agence');
```

---

## PARTIE C : Tables de Mapping Inter-Schemas

### Fichier : `postgres-hub/init/06_create_mapping_tables.sql`

Ces tables hebergees dans PostgreSQL servent de dictionnaire de correspondance pour l'ensemble du systeme federe.

```sql
-- =============================================
-- Tables de mapping inter-schemas
-- =============================================

-- Mapping entre noms de table locaux et distants
CREATE TABLE mapping_table (
    id_mapping SERIAL PRIMARY KEY,
    table_locale VARCHAR(100) NOT NULL,       -- Ex: 'client'
    base_source VARCHAR(50) NOT NULL,          -- Ex: 'postgresql', 'mysql', 'mssql'
    table_distante VARCHAR(100) NOT NULL,      -- Ex: 'dossier_credit'
    schema_source VARCHAR(100) DEFAULT 'public',
    description TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mapping entre attributs de tables heterogenes
CREATE TABLE mapping_attribut (
    id_mapping SERIAL PRIMARY KEY,
    table_source VARCHAR(100) NOT NULL,        -- Table locale PostgreSQL
    attribut_source VARCHAR(100) NOT NULL,     -- Ex: 'icf'
    table_cible VARCHAR(100) NOT NULL,         -- Table distante
    attribut_cible VARCHAR(100) NOT NULL,      -- Ex: 'icf'
    base_cible VARCHAR(50) NOT NULL,           -- 'mysql' ou 'mssql'
    type_conversion VARCHAR(50),               -- Conversion de type si necessaire
    description TEXT
);

-- Catalogue des serveurs distants et leurs proprietes
CREATE TABLE source_donnees (
    id_source SERIAL PRIMARY KEY,
    nom_serveur VARCHAR(100) NOT NULL UNIQUE,  -- Ex: 'mysql_server'
    type_sgbdr VARCHAR(50) NOT NULL,           -- 'mysql', 'mssql'
    hote VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL,
    base_donnees VARCHAR(100) NOT NULL,
    utilisateur VARCHAR(100),
    etat VARCHAR(20) DEFAULT 'actif',          -- 'actif', 'inactif', 'erreur'
    derniere_verification TIMESTAMP,
    description TEXT
);
```

**Inserer les donnees de mapping par defaut** :

```sql
-- Donnees de mapping_table
INSERT INTO mapping_table (table_locale, base_source, table_distante, schema_source, description) VALUES
('client', 'postgresql', 'dossier_credit', 'public', 'Correspondance client <-> dossier de credit via ICF'),
('client', 'postgresql', 'scoring', 'public', 'Correspondance client <-> scoring via ICF'),
('compte', 'postgresql', 'ecriture_comptable', 'public', 'Correspondance compte <-> ecriture comptable'),
('agence', 'postgresql', 'operation_agence', 'public', 'Correspondance agence <-> operation agence'),
('employe', 'postgresql', 'bulletin_paie', 'public', 'Correspondance employe <-> bulletin de paie');

-- Donnees de mapping_attribut
INSERT INTO mapping_attribut (table_source, attribut_source, table_cible, attribut_cible, base_cible, type_conversion, description) VALUES
('client', 'icf', 'dossier_credit', 'icf', 'mysql', NULL, 'Jointure federee client-credit'),
('client', 'icf', 'scoring', 'icf', 'mysql', NULL, 'Jointure federee client-scoring'),
('client', 'id_client', 'dossier_credit', 'id_agent', 'mysql', NULL, 'Reference agent bancaire'),
('agence', 'id_agence', 'ecriture_comptable', 'id_agence', 'mssql', NULL, 'Jointure federee agence-ecriture'),
('employe', 'id_employe', 'bulletin_paie', 'id_employe', 'mssql', NULL, 'Jointure federee employe-paie');

-- Donnees de source_donnees
INSERT INTO source_donnees (nom_serveur, type_sgbdr, hote, port, base_donnees, utilisateur, etat, description) VALUES
('mysql_server', 'mysql', 'mysql-credit', 3306, 'banque_credit', 'fdw_user', 'actif', 'Base MySQL pour credits et scoring'),
('mssql_server', 'mssql', 'mssql-compta', 1433, 'banque_compta', 'fdw_user', 'actif', 'Base SQL Server pour comptabilite et RH');
```

---

## PARTIE D : Vues Federees

### Fichier : `postgres-hub/init/07_create_federated_views.sql`

Les 4 vues federees sont le coeur fonctionnel du systeme. Elles combinent des donnees locales et distantes.

```sql
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
    ec.date_ecriture,
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
    AND ec.date_ecriture = t.date_heure::DATE
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
```

---

## PARTIE E : Vues Materialisees

### Fichier : `postgres-hub/init/08_create_materialized_views.sql`

Les vues materialisees sont utilisees pour les tableaux de bord necessitant des aggregats sur de grands volumes, avec un rafraichissement periodique.

```sql
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
```

---

## PARTIE F : Verification de la federation

Creer un script de verification qui teste que la federation fonctionne correctement :

### Fichier : `scripts/verify-federation.sql`

```sql
-- Test 1 : Verifier que les extensions sont installees
SELECT extname, extversion FROM pg_extension WHERE extname IN ('mysql_fdw', 'tds_fdw');

-- Test 2 : Verifier que les serveurs distants sont configurés
SELECT srvname, srvtype, srvoptions FROM pg_foreign_server;

-- Test 3 : Lister les foreign tables
SELECT ftrelid::regclass AS foreign_table, ftserver::regclass AS server
FROM pg_foreign_table;

-- Test 4 : Tester l'acces aux donnees MySQL
SELECT COUNT(*) AS nb_dossiers FROM fdw_dossier_credit;
SELECT COUNT(*) AS nb_scorings FROM fdw_scoring;

-- Test 5 : Tester l'acces aux donnees SQL Server
SELECT COUNT(*) AS nb_ecritures FROM fdw_ecriture_comptable;
SELECT COUNT(*) AS nb_operations FROM fdw_operation_agence;

-- Test 6 : Tester les vues federees
SELECT * FROM vue_client_complet LIMIT 5;
SELECT * FROM vue_credit_detail LIMIT 5;
SELECT * FROM vue_operation_comptable LIMIT 5;
SELECT * FROM vue_tableau_bord;

-- Test 7 : Verifier le predicate pushdown
EXPLAIN (VERBOSE, COSTS OFF)
SELECT * FROM fdw_dossier_credit WHERE statut = 'approuve';
```

## LIVRABLES ATTENDUS

- [ ] `postgres-hub/init/04_create_fdw_servers.sql`
- [ ] `postgres-hub/init/05_create_foreign_tables.sql`
- [ ] `postgres-hub/init/06_create_mapping_tables.sql`
- [ ] `postgres-hub/init/07_create_federated_views.sql`
- [ ] `postgres-hub/init/08_create_materialized_views.sql`
- [ ] `scripts/verify-federation.sql`
- [ ] Verification : Les vues federees retournent des donnees coherentes combinees des 3 bases

## NOTES IMPORTANTES

- L'ordre d'execution des scripts SQL est crucial : extensions avant serveurs FDW, serveurs FDW avant foreign tables, foreign tables avant vues federees.
- Le predicate pushdown est un mecanisme cle de performance. Verifier avec `EXPLAIN` que les predicats de filtrage sont bien pousses vers les bases distantes.
- Pour `tds_fdw`, le parametre `tds_version` depend de la version de SQL Server. Pour SQL Server 2022, utiliser `7.3` ou `7.4`.
- Les `LATERAL` joins dans les vues federees sont necessaires pour les sous-requetes qui referencent des colonnes de la requete externe.
- Les foreign tables MySQL utilisent `mysql_fdw` qui supporte le predicate pushdown nativement.
- Les foreign tables SQL Server utilisent `tds_fdw` qui supporte partiellement le predicate pushdown.
- Si les foreign tables ne retournent pas de donnees, verifier : (1) que les conteneurs sont demarres, (2) que le reseau Docker est fonctionnel, (3) que les users FDW ont les permissions necessaires, (4) que les credentials sont corrects.
