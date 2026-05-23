# PROMPT 02 - Modelisation des Bases de Donnees (Conceptuel, Logique, Physique)

## OBJECTIF

Creer les schemas SQL complets pour les trois bases de donnees du systeme federe : PostgreSQL (hub central), MySQL (credits et risque), et SQL Server (comptabilite et RH). Chaque base doit avoir ses tables, index, contraintes et donnees de seed.

## PRE-REQUIS

Le prompt `01_ARCHITECTURE_DOCKER.md` a ete execute. Les Dockerfiles et le docker-compose.yml sont en place.

---

## PARTIE A : PostgreSQL - Hub Central

### Fichier : `postgres-hub/init/01_create_extensions.sql`

```sql
-- Extensions necessaires pour la federation
CREATE EXTENSION IF NOT EXISTS mysql_fdw;
CREATE EXTENSION IF NOT EXISTS tds_fdw;
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- Pour SHA-256 (ICF)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- Pour UUID si necessaire
```

### Fichier : `postgres-hub/init/02_create_local_tables.sql`

Creer les tables suivantes avec TOUTES les contraintes :

**Table `agence` :**
```sql
CREATE TABLE agence (
    id_agence SERIAL PRIMARY KEY,
    nom VARCHAR(150) NOT NULL,
    ville VARCHAR(100) NOT NULL,
    adresse VARCHAR(255),
    code_agence VARCHAR(10) NOT NULL UNIQUE
);
```

**Table `employe` :**
```sql
CREATE TABLE employe (
    id_employe SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    poste VARCHAR(100) NOT NULL,
    id_agence INTEGER NOT NULL REFERENCES agence(id_agence),
    date_embauche DATE NOT NULL DEFAULT CURRENT_DATE
);
```

**Table `client` :**
```sql
CREATE TABLE client (
    id_client SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    date_naissance DATE NOT NULL,
    numero_piece VARCHAR(50) NOT NULL UNIQUE,
    icf CHAR(64) NOT NULL UNIQUE,  -- SHA-256 hash
    telephone VARCHAR(20),
    email VARCHAR(150),
    adresse VARCHAR(255),
    id_agence INTEGER NOT NULL REFERENCES agence(id_agence),
    date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Generer l'ICF automatiquement via trigger
    CONSTRAINT chk_icf_format CHECK (icf ~ '^[a-f0-9]{64}$')
);
```

**IMPORTANT** : Creer un trigger `trg_generate_icf` qui genere automatiquement l'ICF lors de l'insertion d'un client :
```sql
CREATE OR REPLACE FUNCTION generer_icf()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.icf IS NULL OR NEW.icf = '' THEN
        NEW.icf := encode(digest(NEW.numero_piece || 'TOGO_BK001', 'sha256'), 'hex');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_icf
    BEFORE INSERT ON client
    FOR EACH ROW
    EXECUTE FUNCTION generer_icf();
```

**Table `compte` :**
```sql
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
```

**Table `transaction` :**
```sql
CREATE TABLE transaction (
    id_transaction SERIAL PRIMARY KEY,
    type_operation VARCHAR(20) NOT NULL CHECK (type_operation IN ('virement', 'retrait', 'depot', 'prelevement')),
    montant NUMERIC(15,2) NOT NULL CHECK (montant > 0),
    devise VARCHAR(3) NOT NULL DEFAULT 'XOF' CHECK (devise IN ('XOF', 'EUR', 'USD')),
    date_heure TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_compte_source INTEGER REFERENCES compte(id_compte),
    id_compte_dest INTEGER REFERENCES compte(id_compte),
    -- Au moins un compte source ou destination doit etre renseigne
    CONSTRAINT chk_compte_source_dest CHECK (id_compte_source IS NOT NULL OR id_compte_dest IS NOT NULL)
);
```

### Fichier : `postgres-hub/init/03_create_indexes.sql`

```sql
-- Index pour les jointures federees via ICF
CREATE UNIQUE INDEX idx_client_icf ON client(icf);

-- Index pour la recherche de compte par IBAN
CREATE UNIQUE INDEX idx_compte_iban ON compte(iban);

-- Index pour lister les comptes d'un client
CREATE INDEX idx_compte_client ON compte(id_client);

-- Index pour les requetes temporelles sur les transactions
CREATE INDEX idx_transaction_date ON transaction(date_heure);

-- Index pour l'historique des transactions d'un compte
CREATE INDEX idx_transaction_compte_source ON transaction(id_compte_source);
CREATE INDEX idx_transaction_compte_dest ON transaction(id_compte_dest);

-- Index pour la recherche d'agences par ville
CREATE INDEX idx_agence_ville ON agence(ville);
```

---

## PARTIE B : MySQL - Credits & Risque

### Fichier : `mysql-credit/init/01_create_tables.sql`

```sql
CREATE DATABASE IF NOT EXISTS banque_credit
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE banque_credit;

CREATE TABLE dossier_credit (
    id_dossier INT AUTO_INCREMENT PRIMARY KEY,
    montant_demande DECIMAL(15,2) NOT NULL CHECK (montant_demande > 0),
    montant_accorde DECIMAL(15,2),
    duree_mois INT NOT NULL CHECK (duree_mois > 0),
    taux DECIMAL(5,2) NOT NULL CHECK (taux > 0 AND taux <= 100),
    statut ENUM('en_cours', 'approuve', 'rejete', 'cloture') NOT NULL DEFAULT 'en_cours',
    icf CHAR(64) NOT NULL,  -- Identifiant Client Federe
    id_agent INT,  -- Reference logique vers employe dans PostgreSQL
    date_soumission DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_decision DATETIME,
    motif_rejet TEXT,

    INDEX idx_dossier_icf (icf),
    INDEX idx_dossier_statut (statut),
    INDEX idx_dossier_date (date_soumission)
) ENGINE=InnoDB;

CREATE TABLE garantie (
    id_garantie INT AUTO_INCREMENT PRIMARY KEY,
    type_garantie VARCHAR(50) NOT NULL CHECK (type_garantie IN ('nantissement', 'caution', 'hypotheque', 'depot_gage', 'autre')),
    valeur_estimee DECIMAL(15,2) NOT NULL CHECK (valeur_estimee > 0),
    description TEXT,
    id_dossier INT NOT NULL,
    date_evaluation DATE,

    INDEX idx_garantie_dossier (id_dossier),
    CONSTRAINT fk_garantie_dossier FOREIGN KEY (id_dossier) REFERENCES dossier_credit(id_dossier)
) ENGINE=InnoDB;

CREATE TABLE echeancier (
    id_echeance INT AUTO_INCREMENT PRIMARY KEY,
    date_echeance DATE NOT NULL,
    montant_capital DECIMAL(15,2) NOT NULL CHECK (montant_capital >= 0),
    montant_interet DECIMAL(15,2) NOT NULL CHECK (montant_interet >= 0),
    statut_paiement ENUM('pending', 'paid', 'overdue') NOT NULL DEFAULT 'pending',
    date_paiement_effectif DATE,
    id_dossier INT NOT NULL,

    INDEX idx_echeance_dossier (id_dossier),
    INDEX idx_echeance_date (date_echeance),
    INDEX idx_echeance_statut (statut_paiement),
    CONSTRAINT fk_echeance_dossier FOREIGN KEY (id_dossier) REFERENCES dossier_credit(id_dossier)
) ENGINE=InnoDB;

CREATE TABLE scoring (
    id_scoring INT AUTO_INCREMENT PRIMARY KEY,
    score INT NOT NULL CHECK (score BETWEEN 0 AND 100),
    niveau_risque ENUM('faible', 'moyen', 'eleve', 'tres_eleve') NOT NULL,
    date_evaluation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    icf CHAR(64) NOT NULL,  -- Identifiant Client Federe
    commentaire TEXT,

    -- Regle de determination automatique du niveau_risque
    -- 0-25: tres_eleve, 26-50: eleve, 51-75: moyen, 76-100: faible

    INDEX idx_scoring_icf (icf),
    INDEX idx_scoring_icf_date (icf, date_evaluation),
    INDEX idx_scoring_niveau (niveau_risque)
) ENGINE=InnoDB;
```

**IMPORTANT** : Creer un trigger MySQL `trg_determiner_niveau_risque` qui determine automatiquement le `niveau_risque` en fonction du `score` :

```sql
DELIMITER //
CREATE TRIGGER trg_determiner_niveau_risque
BEFORE INSERT ON scoring
FOR EACH ROW
BEGIN
    IF NEW.niveau_risque IS NULL OR NEW.niveau_risque = '' THEN
        IF NEW.score <= 25 THEN
            SET NEW.niveau_risque = 'tres_eleve';
        ELSEIF NEW.score <= 50 THEN
            SET NEW.niveau_risque = 'eleve';
        ELSEIF NEW.score <= 75 THEN
            SET NEW.niveau_risque = 'moyen';
        ELSE
            SET NEW.niveau_risque = 'faible';
        END IF;
    END IF;
END//
DELIMITER ;
```

### Fichier : `mysql-credit/init/02_create_user.sql`

Creer un utilisateur `fdw_user` pour la connexion FDW depuis PostgreSQL :

```sql
CREATE USER IF NOT EXISTS 'fdw_user'@'%' IDENTIFIED BY 'FdwT0g0!2025';
GRANT SELECT ON banque_credit.* TO 'fdw_user'@'%';
FLUSH PRIVILEGES;
```

---

## PARTIE C : SQL Server - Comptabilite & RH

### Fichier : `mssql-compta/init/01_create_tables.sql`

```sql
USE banque_compta;
GO

-- Table du plan comptable OHADA
CREATE TABLE plan_comptable (
    numero_compte VARCHAR(10) PRIMARY KEY,
    libelle NVARCHAR(200) NOT NULL,
    classe_compte INT NOT NULL CHECK (classe_compte BETWEEN 1 AND 9),
    sous_classe NVARCHAR(100)
);

-- Table des ecritures comptables
CREATE TABLE ecriture_comptable (
    id_ecriture INT IDENTITY(1,1) PRIMARY KEY,
    date_ecriture DATE NOT NULL,
    libelle NVARCHAR(255) NOT NULL,
    debit DECIMAL(18,2) NOT NULL DEFAULT 0 CHECK (debit >= 0),
    credit DECIMAL(18,2) NOT NULL DEFAULT 0 CHECK (credit >= 0),
    numero_compte VARCHAR(10) NOT NULL,
    journal NVARCHAR(50) NOT NULL,
    id_agence INT,  -- Reference logique vers agence dans PostgreSQL
    piece_justificative NVARCHAR(100),
    date_saisie DATETIME NOT NULL DEFAULT GETDATE(),

    CONSTRAINT fk_ecriture_plan FOREIGN KEY (numero_compte) REFERENCES plan_comptable(numero_compte)
);

-- Table des bulletins de paie
CREATE TABLE bulletin_paie (
    id_bulletin INT IDENTITY(1,1) PRIMARY KEY,
    mois INT NOT NULL CHECK (mois BETWEEN 1 AND 12),
    annee INT NOT NULL CHECK (annee >= 2020),
    salaire_brut DECIMAL(18,2) NOT NULL CHECK (salaire_brut >= 0),
    salaire_net DECIMAL(18,2) NOT NULL CHECK (salaire_net >= 0),
    net_a_payer DECIMAL(18,2) NOT NULL CHECK (net_a_payer >= 0),
    id_employe INT NOT NULL,  -- Reference logique vers employe dans PostgreSQL
    id_agence INT,  -- Reference logique vers agence dans PostgreSQL
    date_emission DATETIME NOT NULL DEFAULT GETDATE()
);

-- Table des operations d'agence
CREATE TABLE operation_agence (
    id_operation INT IDENTITY(1,1) PRIMARY KEY,
    type_operation NVARCHAR(50) NOT NULL,
    montant DECIMAL(18,2) NOT NULL CHECK (montant > 0),
    devise NVARCHAR(3) NOT NULL DEFAULT 'XOF' CHECK (devise IN ('XOF', 'EUR', 'USD')),
    date_operation DATETIME NOT NULL DEFAULT GETDATE(),
    id_agence INT NOT NULL,  -- Reference logique vers agence dans PostgreSQL
    id_employe INT,  -- Reference logique vers employe dans PostgreSQL
    description NVARCHAR(500)
);
```

### Fichier : `mssql-compta/init/02_create_indexes.sql`

```sql
USE banque_compta;
GO

-- Index pour les ecritures comptables
CREATE INDEX idx_ecriture_date ON ecriture_comptable(date_ecriture);
CREATE INDEX idx_ecriture_compte ON ecriture_comptable(numero_compte);
CREATE INDEX idx_ecriture_agence ON ecriture_comptable(id_agence);
CREATE INDEX idx_ecriture_compte_date ON ecriture_comptable(numero_compte, date_ecriture); -- Index couvrant pour le grand livre

-- Index pour les bulletins de paie
CREATE INDEX idx_bulletin_employe ON bulletin_paie(id_employe);
CREATE INDEX idx_bulletin_periode ON bulletin_paie(annee, mois);

-- Index pour les operations d'agence
CREATE INDEX idx_operation_agence ON operation_agence(id_agence);
CREATE INDEX idx_operation_date ON operation_agence(date_operation);
```

### Fichier : `mssql-compta/init/03_create_user.sql`

Creer un utilisateur `fdw_user` pour la connexion FDW depuis PostgreSQL :

```sql
USE banque_compta;
GO

CREATE LOGIN fdw_user WITH PASSWORD = 'FdwMssqlT0g0!';
CREATE USER fdw_user FOR LOGIN fdw_user;
ALTER ROLE db_datareader ADD MEMBER fdw_user;
```

---

## PARTIE D : Donnees de Seed (donnees de test realistes)

### Fichier : `postgres-hub/seed/seed_postgres.sql`

Inserer des donnees realistes pour une banque togolaise avec **au minimum** :
- 5 agences (Lome, Kpalime, Sokode, Kara, Dapaong)
- 10 employes (2 par agence)
- 20 clients (4 par agence) avec des noms togolais realistes
- 30 comptes (melange courant, epargne, terme)
- 100 transactions (melange des 4 types, montants realistes en XOF)

**Exemples de noms togolais** : Afiavi Mensah, Kossi Agbe, Ayaovi Dossou, Essozimna Batcho, Dzifa Kpatcha, Yao Amegah, Akuvi Adzah, Sena Kpelly, Komla Dodji, Fafa Segla

**Exemples d'IBAN** : Utiliser un format fictif mais realiste : `TG00BK001XXXXXXXXXX` (20 caracteres)

### Fichier : `mysql-credit/seed/seed_mysql.sql`

Inserer des donnees realistes avec **au minimum** :
- 15 dossiers de credit (melange des 4 statuts)
- 20 garanties (1-2 par dossier)
- 50 echeances (3-4 par dossier)
- 20 scorings (1 par client avec ICF correspondant)

### Fichier : `mssql-compta/seed/seed_mssql.sql`

Inserer des donnees realistes avec **au minimum** :
- 50 comptes du plan comptable OHADA (classes 1-7 minimum)
- 100 ecritures comptables
- 20 bulletins de paie
- 50 operations d'agence

**Plan comptable OHADA minimum** :
| Classe | Comptes exemples |
|---|---|
| 1 - Comptes de capitaux | 101000 Capital, 106000 Reserves, 120000 Resultat net |
| 2 - Comptes d'immobilisations | 211000 Terrains, 213000 Constructions, 244000 Materiel informatique |
| 3 - Comptes de stocks | 310000 Stocks de fournitures |
| 4 - Comptes de tiers | 411000 Clients, 421000 Personnel, 470000 Autres debiteurs |
| 5 - Comptes de tresorerie | 511000 Banque, 521000 Caisse |
| 6 - Comptes de charges | 611000 Achats, 621000 Services exterieurs, 631000 Impots, 661000 Charges de personnel |
| 7 - Comptes de produits | 711000 Ventes, 721000 Production immobilisee, 751000 Interets |

## LIVRABLES ATTENDUS

- [ ] `postgres-hub/init/01_create_extensions.sql`
- [ ] `postgres-hub/init/02_create_local_tables.sql` (avec trigger ICF)
- [ ] `postgres-hub/init/03_create_indexes.sql`
- [ ] `postgres-hub/seed/seed_postgres.sql` (donnees realistes)
- [ ] `mysql-credit/init/01_create_tables.sql` (avec trigger niveau_risque)
- [ ] `mysql-credit/init/02_create_user.sql`
- [ ] `mysql-credit/seed/seed_mysql.sql` (donnees realistes)
- [ ] `mssql-compta/init/01_create_tables.sql`
- [ ] `mssql-compta/init/02_create_indexes.sql`
- [ ] `mssql-compta/init/03_create_user.sql`
- [ ] `mssql-compta/seed/seed_mssql.sql` (donnees realistes)
- [ ] Verification : Chaque script SQL doit etre syntaxiquement correct et executable sans erreur

## NOTES IMPORTANTES

- L'ICF dans les donnees de seed doit etre **coherent entre les trois bases**. Un client avec un ICF donne dans PostgreSQL doit avoir le meme ICF dans MySQL (table scoring et dossier_credit). Generer les ICF d'abord en Python/SQL puis les utiliser dans les trois scripts de seed.
- Les montants doivent etre realistes pour le contexte togolais (un credit moyen de 500 000 a 10 000 000 XOF, un salaire moyen de 80 000 a 500 000 XOF).
- Les dates doivent etre coherentes (pas de transaction future, pas de credit cloture avant sa soumission).
- Pour SQL Server, les scripts d'initialisation ne fonctionnent pas avec le mecanisme `/docker-entrypoint-initdb.d/`. Il faut utiliser un script d'entree personnalise qui attend le demarrage de SQL Server puis execute les scripts.
