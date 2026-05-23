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
OPTIONS (dbname 'banque_credit', table_name 'dossier_credit');

CREATE FOREIGN TABLE fdw_garantie (
    id_garantie INTEGER,
    type_garantie VARCHAR(50),
    valeur_estimee NUMERIC(15,2),
    description TEXT,
    id_dossier INTEGER,
    date_evaluation DATE
)
SERVER mysql_server
OPTIONS (dbname 'banque_credit', table_name 'garantie');

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
OPTIONS (dbname 'banque_credit', table_name 'echeancier');

CREATE FOREIGN TABLE fdw_scoring (
    id_scoring INTEGER,
    score INTEGER,
    niveau_risque VARCHAR(20),
    date_evaluation TIMESTAMP,
    icf CHAR(64),
    commentaire TEXT
)
SERVER mysql_server
OPTIONS (dbname 'banque_credit', table_name 'scoring');

-- =============================================
-- Foreign Tables depuis SQL Server (Comptabilite & RH)
-- =============================================

CREATE FOREIGN TABLE fdw_ecriture_comptable (
    id_ecriture INTEGER,
    date_ecriture VARCHAR(30),
    libelle VARCHAR(255),
    debit NUMERIC(18,2),
    credit NUMERIC(18,2),
    numero_compte VARCHAR(10),
    journal VARCHAR(50),
    id_agence INTEGER,
    piece_justificative VARCHAR(100),
    date_saisie VARCHAR(30)
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
    date_operation VARCHAR(30),
    id_agence INTEGER,
    id_employe INTEGER,
    description VARCHAR(500)
)
SERVER mssql_server
OPTIONS (schema_name 'dbo', table_name 'operation_agence');
