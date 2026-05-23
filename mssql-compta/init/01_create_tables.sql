-- =============================================
-- Tables SQL Server - Comptabilite & RH
-- =============================================

-- Table du plan comptable OHADA
CREATE TABLE plan_comptable (
    numero_compte VARCHAR(10) PRIMARY KEY,
    libelle NVARCHAR(200) NOT NULL,
    classe_compte INT NOT NULL CHECK (classe_compte BETWEEN 1 AND 9),
    sous_classe NVARCHAR(100)
);
GO

-- Table des ecritures comptables
CREATE TABLE ecriture_comptable (
    id_ecriture INT IDENTITY(1,1) PRIMARY KEY,
    date_ecriture DATE NOT NULL,
    libelle NVARCHAR(255) NOT NULL,
    debit DECIMAL(18,2) NOT NULL DEFAULT 0 CHECK (debit >= 0),
    credit DECIMAL(18,2) NOT NULL DEFAULT 0 CHECK (credit >= 0),
    numero_compte VARCHAR(10) NOT NULL,
    journal NVARCHAR(50) NOT NULL,
    id_agence INT,
    piece_justificative NVARCHAR(100),
    date_saisie DATETIME NOT NULL DEFAULT GETDATE(),

    CONSTRAINT fk_ecriture_plan FOREIGN KEY (numero_compte) REFERENCES plan_comptable(numero_compte)
);
GO

-- Table des bulletins de paie
CREATE TABLE bulletin_paie (
    id_bulletin INT IDENTITY(1,1) PRIMARY KEY,
    mois INT NOT NULL CHECK (mois BETWEEN 1 AND 12),
    annee INT NOT NULL CHECK (annee >= 2020),
    salaire_brut DECIMAL(18,2) NOT NULL CHECK (salaire_brut >= 0),
    salaire_net DECIMAL(18,2) NOT NULL CHECK (salaire_net >= 0),
    net_a_payer DECIMAL(18,2) NOT NULL CHECK (net_a_payer >= 0),
    id_employe INT NOT NULL,
    id_agence INT,
    date_emission DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- Table des operations d'agence
CREATE TABLE operation_agence (
    id_operation INT IDENTITY(1,1) PRIMARY KEY,
    type_operation NVARCHAR(50) NOT NULL,
    montant DECIMAL(18,2) NOT NULL CHECK (montant > 0),
    devise NVARCHAR(3) NOT NULL DEFAULT 'XOF' CHECK (devise IN ('XOF', 'EUR', 'USD')),
    date_operation DATETIME NOT NULL DEFAULT GETDATE(),
    id_agence INT NOT NULL,
    id_employe INT,
    description NVARCHAR(500)
);
GO
