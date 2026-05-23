-- =============================================
-- Tables de mapping inter-schemas
-- =============================================

-- Mapping entre noms de table locaux et distants
CREATE TABLE mapping_table (
    id_mapping SERIAL PRIMARY KEY,
    table_locale VARCHAR(100) NOT NULL,
    base_source VARCHAR(50) NOT NULL,
    table_distante VARCHAR(100) NOT NULL,
    schema_source VARCHAR(100) DEFAULT 'public',
    description TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mapping entre attributs de tables heterogenes
CREATE TABLE mapping_attribut (
    id_mapping SERIAL PRIMARY KEY,
    table_source VARCHAR(100) NOT NULL,
    attribut_source VARCHAR(100) NOT NULL,
    table_cible VARCHAR(100) NOT NULL,
    attribut_cible VARCHAR(100) NOT NULL,
    base_cible VARCHAR(50) NOT NULL,
    type_conversion VARCHAR(50),
    description TEXT
);

-- Catalogue des serveurs distants et leurs proprietes
CREATE TABLE source_donnees (
    id_source SERIAL PRIMARY KEY,
    nom_serveur VARCHAR(100) NOT NULL UNIQUE,
    type_sgbdr VARCHAR(50) NOT NULL,
    hote VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL,
    base_donnees VARCHAR(100) NOT NULL,
    utilisateur VARCHAR(100),
    etat VARCHAR(20) DEFAULT 'actif',
    derniere_verification TIMESTAMP,
    description TEXT
);

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
