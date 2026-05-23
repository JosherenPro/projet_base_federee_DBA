-- =============================================
-- Tables locales PostgreSQL - Hub Central
-- =============================================

-- Table agence
CREATE TABLE agence (
    id_agence SERIAL PRIMARY KEY,
    nom VARCHAR(150) NOT NULL,
    ville VARCHAR(100) NOT NULL,
    adresse VARCHAR(255),
    code_agence VARCHAR(10) NOT NULL UNIQUE
);

-- Table employe
CREATE TABLE employe (
    id_employe SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    poste VARCHAR(100) NOT NULL,
    id_agence INTEGER NOT NULL REFERENCES agence(id_agence),
    date_embauche DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Fonction de generation de l'ICF
CREATE OR REPLACE FUNCTION generer_icf()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.icf IS NULL OR NEW.icf = '' THEN
        NEW.icf := encode(digest(NEW.numero_piece || 'TOGO_BK001', 'sha256'), 'hex');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Table client
CREATE TABLE client (
    id_client SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    date_naissance DATE NOT NULL,
    numero_piece VARCHAR(50) NOT NULL UNIQUE,
    icf CHAR(64) NOT NULL UNIQUE,
    telephone VARCHAR(20),
    email VARCHAR(150),
    adresse VARCHAR(255),
    id_agence INTEGER NOT NULL REFERENCES agence(id_agence),
    date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_icf_format CHECK (icf ~ '^[a-f0-9]{64}$')
);

-- Trigger pour generer l'ICF automatiquement
CREATE TRIGGER trg_generate_icf
    BEFORE INSERT ON client
    FOR EACH ROW
    EXECUTE FUNCTION generer_icf();

-- Table compte
CREATE TABLE compte (
    id_compte SERIAL PRIMARY KEY,
    iban VARCHAR(34) NOT NULL UNIQUE,
    type_compte VARCHAR(20) NOT NULL CHECK (type_compte IN ('courant', 'epargne', 'terme')),
    solde NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (solde >= 0 OR type_compte != 'epargne'),
    date_ouverture DATE NOT NULL DEFAULT CURRENT_DATE,
    statut VARCHAR(15) NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif', 'cloture', 'suspendu')),
    id_client INTEGER NOT NULL REFERENCES client(id_client),
    id_agence INTEGER NOT NULL REFERENCES agence(id_agence)
);

-- Table transaction
CREATE TABLE transaction (
    id_transaction SERIAL PRIMARY KEY,
    type_operation VARCHAR(20) NOT NULL CHECK (type_operation IN ('virement', 'retrait', 'depot', 'prelevement')),
    montant NUMERIC(15,2) NOT NULL CHECK (montant > 0),
    devise VARCHAR(3) NOT NULL DEFAULT 'XOF' CHECK (devise IN ('XOF', 'EUR', 'USD')),
    date_heure TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_compte_source INTEGER REFERENCES compte(id_compte),
    id_compte_dest INTEGER REFERENCES compte(id_compte),
    CONSTRAINT chk_compte_source_dest CHECK (id_compte_source IS NOT NULL OR id_compte_dest IS NOT NULL)
);
