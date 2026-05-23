# Administration de Bases de Donnees Federees - Banque Commerciale du Togo

[![GitHub](https://img.shields.io/badge/Repo-github.com/votre--organisation/projet--fin--dba-181717)](https://github.com/votre-organisation/projet-fin-dba)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)](https://www.postgresql.org)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479a1)](https://www.mysql.com)
[![SQL Server](https://img.shields.io/badge/SQL%20Server-2022-cc2927)](https://www.microsoft.com/en-us/sql-server)

**Universite de Lome** — **Departement de Genie Informatique** — **Licence 3**
**UE : Administration des Bases de Donnees**

---

## Vue d'ensemble

Ce projet met en place une **architecture a 3 SGBD heterogenes** intercommunicants via une couche de federation. Chaque SGBD est autonome dans son domaine mais participe a un systeme d'information integre.

```
+============================================================================+
|                        RESEAU DOCKER : reseau-banque                       |
|                         Bridge, 172.x.0.0/16                              |
+============================================================================+
         |                         |                         |
+-------------------+  +--------------------+  +------------------------+
|   SGBD 1 : HUB    |  |  SGBD 2 : CREDITS  |  |  SGBD 3 : COMPTA      |
|   PostgreSQL 16   |  |  MySQL 8.0         |  |  SQL Server 2022      |
|   Conteneur :     |  |  Conteneur :       |  |  Conteneur :          |
|   postgres-hub    |  |  mysql-credit      |  |  mssql-compta         |
|   Port interne:   |  |  Port interne:     |  |  Port interne:        |
|   5432            |  |  3306              |  |  1433                 |
|   Port hote:      |  |  Port hote:        |  |  Port hote:           |
|   5435            |  |  3308              |  |  1435                 |
+-------------------+  +--------------------+  +------------------------+
         |                         |                         |
         |     Couche FDW          |                         |
         |  (Foreign Data          |                         |
         |   Wrappers)             |                         |
         |  mysql_fdw              |                         |
         |  tds_fdw                |                         |
         +-------------------------+-------------------------+
         |                         |                         |
         +---------------------------------------------------+
         |                    FASTAPI                         |
         |              uvicorn :8000                         |
         +---------------------------------------------------+
         |                    REACT                           |
         |              vite :3000                            |
         +---------------------------------------------------+
```

---

## Architecture des 3 SGBD

### 1. PostgreSQL 16 — Hub central

```
CONTAINER: postgres-hub
IMAGE:     postgres:16 + mysql_fdw + tds_fdw (custom Dockerfile)
PORT:      interne 5432 -> hote 5435
VOLUME:    pg_data (persistance)
ROLE:      Hub federateur + donnees locales
```

Le hub central est construit a partir d'une image PostgreSQL 16 enrichie des extensions FDW :

```dockerfile
FROM postgres:16

# Installation des extensions FDW depuis les sources
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-server-dev-16 git build-essential \
    libmysqlclient-dev libssl-dev unixodbc-dev \
    && git clone https://github.com/EnterpriseDB/mysql_fdw.git \
    && cd mysql_fdw && make && make install \
    && git clone https://github.com/tds-fdw/tds_fdw.git \
    && cd tds_fdw && make && make install
```

Il heberge :
- **5 tables locales** : `agence`, `employe`, `client`, `compte`, `transaction`
- **8 tables distantes FDW** pointant vers MySQL et SQL Server
- **4 vues federees** combinant donnees locales et distantes
- **2 vues materialisees** pour les indicateurs de performance

**Initialisation** (ordre chronologique) :

```
postgres-hub/init/           # 1. DDL des tables locales
  ├── 01-schema.sql          #    CREATE TABLE + contraintes
  ├── 02-index.sql           #    CREATE INDEX
  └── 03-functions.sql       #    Fonctions PL/pgSQL (generation ICF)

postgres-hub/fdw-init/       # 2. Configuration FDW (execute apres)
  ├── 01-mysql-server.sql    #    CREATE SERVER mysql_server
  ├── 02-mysql-tables.sql    #    CREATE FOREIGN TABLE (4)
  ├── 03-mssql-server.sql    #    CREATE SERVER mssql_server
  ├── 04-mssql-tables.sql    #    CREATE FOREIGN TABLE (4)
  ├── 05-views.sql           #    CREATE VIEW (vues federees)
  └── 06-materialized-views.sql  # CREATE MATERIALIZED VIEW

postgres-hub/seed/           # 3. Donnees de test
  └── seed.sql               #    INSERT (idempotent, TRUNCATE + RESTART)
```

**Script de post-init differe** :

Le fichier `post-init/post-init.sh` attend que MySQL et SQL Server soient operants avant de lancer les scripts FDW :

```bash
#!/bin/bash
until mysql -h mysql-credit -u fdw_user -pFdwT0g0!2025 -e "SELECT 1"; do
  echo "Attente de MySQL..."
  sleep 2
done

until /opt/mssql-tools18/bin/sqlcmd -S mssql-compta -U fdw_user \
  -P FdwMssqlT0g0! -C -Q "SELECT 1"; do
  echo "Attente de SQL Server..."
  sleep 2
done

# Execution des scripts FDW
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/fdw-init/01-mysql-server.sql
# ...
```

### 2. MySQL 8.0 — Credits & Risque

```
CONTAINER: mysql-credit
IMAGE:     mysql:8.0 (custom avec my.cnf)
PORT:      interne 3306 -> hote 3308
VOLUME:    mysql_data (persistance)
ROLE:      Gestion des credits, garanties, echeanciers et scoring risque
```

SGBD source specialise dans le domaine du risque bancaire. Configuration reseau :

```ini
# my.cnf : ecoute sur toutes les interfaces (necessaire pour FDW)
bind-address = 0.0.0.0
port = 3306
```

**Initialisation** :

```
mysql-credit/init/
  ├── 01-tables.sql          # CREATE TABLE dossier_credit, garantie, echeancier, scoring
  ├── 02-user.sql            # CREATE USER fdw_user + privileges
  └── 03-seed.sql            # INSERT donnees de test
```

**Comptes utilisateurs** :

| Utilisateur | Mot de passe | Privileges |
|-------------|--------------|------------|
| `credit_user` | `Cr3ditT0g0!` | Acces applicatif (SELECT, INSERT, UPDATE) |
| `fdw_user` | `FdwT0g0!2025` | Acces FDW (SELECT only) |
| `root` | `R00tT0g0!` | Administration |

### 3. SQL Server 2022 — Comptabilite & RH

```
CONTAINER: mssql-compta
IMAGE:     mssql/server:2022-latest
PORT:      interne 1433 -> hote 1435
VOLUME:    mssql_data (persistance)
ROLE:      Comptabilite OHADA + gestion du personnel
```

SGBD source pour les donnees comptables et RH. Particularite : acceptation de la licence (ACCEPT_EULA).

**Initialisation** :

```
mssql-compta/init/
  ├── 01-tables.sql          # CREATE TABLE plan_comptable, ecriture_comptable,
  │                          #   bulletin_paie, operation_agence
  ├── 02-index.sql           # CREATE INDEX
  └── 03-user.sql            # CREATE USER fdw_user + GRANT

mssql-compta/seed/
  └── seed.sql               # INSERT donnees de test
```

**Comptes utilisateurs** :

| Utilisateur | Mot de passe | Role |
|-------------|--------------|------|
| `sa` | `C0mptaT0g0!2025` | Administrateur systeme |
| `fdw_user` | `FdwMssqlT0g0!` | Lecture seule pour FDW |

**Particularite tds_fdw** : Les colonnes DATE de SQL Server sont retournees au format `VARCHAR(30)` par le wrapper FreeTDS. Exemple de valeur : `Jan 10 2024 12:00:00:AM`. Les vues federees utilisent `TO_DATE()` pour convertir.

---

## Couche de Federation (FDW)

### Principe de fonctionnement

Les Foreign Data Wrappers permettent a PostgreSQL d'interroger des donnees stockees dans d'autres SGBD sans duplication ni ETL :

```
+-------------------+         +-------------------+
|   PostgreSQL      |         |   MySQL           |
|   Requete SQL     |  --->   |   Donnees         |
|   SELECT * FROM   |  mysql_fdw                |
|   fdw_dossier_    |  <---   |   Resultats       |
|   credit          |         |                   |
+-------------------+         +-------------------+
         |
         | Planificateur PostgreSQL
         | (delegue la partie distante
         |  au wrapper FDW)
         v
+-------------------+
|   Resultat        |
|   combine         |
+-------------------+
```

### Configuration des serveurs etrangers

**mysql_fdw** :

```sql
-- Extension
CREATE EXTENSION IF NOT EXISTS mysql_fdw;

-- Serveur etranger pointant vers MySQL
CREATE SERVER mysql_server
  FOREIGN DATA WRAPPER mysql_fdw
  OPTIONS (host 'mysql-credit', port '3306', database 'banque_credit');

-- Mapping de l'utilisateur PostgreSQL vers l'utilisateur MySQL
CREATE USER MAPPING FOR banque_admin
  SERVER mysql_server
  OPTIONS (username 'fdw_user', password 'FdwT0g0!2025');
```

**tds_fdw** :

```sql
-- Extension
CREATE EXTENSION IF NOT EXISTS tds_fdw;

-- Serveur etranger pointant vers SQL Server via FreeTDS
CREATE SERVER mssql_server
  FOREIGN DATA WRAPPER tds_fdw
  OPTIONS (servername 'mssql-compta', port '1433',
           database 'banque_compta', tds_version '7.4');

-- Mapping
CREATE USER MAPPING FOR banque_admin
  SERVER mssql_server
  OPTIONS (username 'fdw_user', password 'FdwMssqlT0g0!');
```

### Tables distantes

Chaque table distante est declaree avec `CREATE FOREIGN TABLE` en miroir de la table source :

```sql
-- Table MySQL distante
CREATE FOREIGN TABLE fdw_dossier_credit (
  id INTEGER,
  client_icf VARCHAR(64),
  montant DECIMAL(15,2),
  duree_mois INTEGER,
  taux_interet DECIMAL(5,2),
  statut VARCHAR(20),
  date_soumission DATE,
  date_decision DATE
) SERVER mysql_server
  OPTIONS (table_name 'dossier_credit');

-- Table SQL Server distante (dates en VARCHAR)
CREATE FOREIGN TABLE fdw_ecriture_comptable (
  id INTEGER,
  compte_debit VARCHAR(20),
  compte_credit VARCHAR(20),
  montant DECIMAL(15,2),
  date_ecriture VARCHAR(30),    -- VARCHAR a cause de tds_fdw
  libelle TEXT,
  agence_id INTEGER
) SERVER mssql_server
  OPTIONS (table_name 'ecriture_comptable', row_estimate_method 'showplan_all');
```

### Vues federees (jointures inter-SGBD)

Les vues combinent donnees locales et distantes :

```sql
-- Vue multi-SGBD : PostgreSQL + MySQL
CREATE VIEW vue_client_complet AS
SELECT
  c.icf,
  c.nom || ' ' || c.prenom AS nom_complet,
  a.nom AS agence,
  COALESCE(s.score, 0) AS score_risque,
  s.categorie_risque,
  COALESCE(SUM(cr.montant), 0) AS total_credits,
  COUNT(DISTINCT cr.id) AS nb_credits
FROM client c                          -- Table locale (PostgreSQL)
JOIN agence a ON c.agence_id = a.id    -- Table locale (PostgreSQL)
LEFT JOIN fdw_scoring s                -- Table distante (MySQL via FDW)
  ON c.icf = s.client_icf
LEFT JOIN fdw_dossier_credit cr        -- Table distante (MySQL via FDW)
  ON c.icf = cr.client_icf
GROUP BY c.icf, c.nom, c.prenom, a.nom, s.score, s.categorie_risque;

-- Vue tri-SGBD : PostgreSQL + MySQL + SQL Server
CREATE VIEW vue_tableau_bord AS
SELECT
  a.id,
  a.nom AS agence,
  COUNT(DISTINCT c.icf) AS nb_clients,
  COUNT(DISTINCT cp.id) AS nb_comptes,
  COALESCE(SUM(CASE WHEN cp.type = 'courant' THEN cp.solde ELSE 0 END), 0) AS depots_vue,
  COALESCE(SUM(fdc.montant), 0) AS encours_credits,
  COALESCE(SUM(fec.montant), 0) AS total_ecritures
FROM agence a                          -- PostgreSQL
LEFT JOIN client c ON c.agence_id = a.id           -- PostgreSQL
LEFT JOIN compte cp ON cp.client_icf = c.icf       -- PostgreSQL
LEFT JOIN fdw_dossier_credit fdc                    -- MySQL (FDW)
  ON fdc.client_icf = c.icf
LEFT JOIN fdw_ecriture_comptable fec                -- SQL Server (FDW)
  ON fec.agence_id = a.id
GROUP BY a.id, a.nom;
```

### Vues materialisees

Pour les performances, les aggregations lourdes sont materialisees :

```sql
CREATE MATERIALIZED VIEW mv_tableau_bord AS
SELECT * FROM vue_tableau_bord;  -- Cache les jointures inter-SGBD

CREATE MATERIALIZED VIEW mv_clients_risque_eleve AS
SELECT icf, nom_complet, score_risque, categorie
FROM vue_client_complet
WHERE categorie_risque IN ('eleve', 'tres_eleve')
ORDER BY score_risque DESC;

-- Rafraichissement
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_tableau_bord;
```

---

## Architecture reseau et conteneurisation

### Topologie Docker

```yaml
networks:
  reseau-banque:          # Reseau prive bridge
    driver: bridge

services:
  postgres-hub:
    ports:
      - "5435:5432"       # Hote:Conteneur
    networks:
      - reseau-banque
    depends_on:
      mysql-credit:
        condition: service_healthy
      mssql-compta:
        condition: service_healthy
    # mysql_fdw et tds_fdw compiles dans le Dockerfile

  mysql-credit:
    ports:
      - "3308:3306"
    networks:
      - reseau-banque
    # bind-address = 0.0.0.0 pour autoriser les connexions FDW

  mssql-compta:
    ports:
      - "1435:1433"
    networks:
      - reseau-banque
    # ACCEPT_EULA requis

  fastapi-backend:
    ports:
      - "8000:8000"
    depends_on:
      postgres-hub:
        condition: service_healthy
    # Connexion aux 3 bases via les noms de conteneurs
```

### Communication inter-conteneurs

```
NOM CONTENEUR      RESEAU INTERNE       PORT     VISIBLE DE
postgres-hub       reseau-banque        5432     tous les conteneurs + hote:5435
mysql-credit       reseau-banque        3306     tous les conteneurs + hote:3308
mssql-compta       reseau-banque        1433     tous les conteneurs + hote:1435
fastapi-backend    reseau-banque        8000     tous les conteneurs + hote:8000
react-frontend     reseau-banque        3000     hote:3000
```

Les connexions entre conteneurs utilisent les **noms de services Docker** (ex: `postgres-hub`, `mysql-credit`) et les **ports internes** (5432, 3306, 1433), tandis que l'acces depuis l'hote utilise les ports mappes (5435, 3308, 1435).

### Pipeline de demarrage

```
$ docker compose up -d --build

1. mysql-credit  [healthcheck: mysqladmin ping]     |
2. mssql-compta  [healthcheck: sqlcmd SELECT 1]     |  ← Parallele
3. postgres-hub                                       ← Attend 1 et 2
   ├── init/ (tables locales)
   └── post-init/ (configure FDW → tables distantes → vues)
4. fastapi-backend [healthcheck: curl /api/health]    ← Attend 3
5. react-frontend                                     ← Attend 4
```

---

## Captures d'ecran

### Tableau de bord federé (vue agregee des 3 SGBD)
![Dashboard](screenshots/01-dashboard.png)
> Requete sur la vue tri-SGBD `vue_tableau_bord` : total clients (PostgreSQL), credits (MySQL via FDW), ecritures comptables (SQL Server via FDW). Graphiques generes par jointures inter-bases.

### Liste des clients (PostgreSQL — table locale)
![Clients](screenshots/02-clients.png)
> Table `client` du hub PostgreSQL. L'ICF (colonne de 64 caracteres) est l'identifiant transverse SHA-256 genere par fonction PL/pgSQL.

### Comptes bancaires (PostgreSQL — table locale)
![Comptes](screenshots/03-comptes.png)
> Table `compte` avec ses 3 types (courant, epargne, terme). Jointure possible avec `fdw_dossier_credit` (MySQL) via l'ICF.

### Credits (MySQL — table distante via mysql_fdw)
![Credits](screenshots/04-credits.png)
> Les 15 dossiers de credit interroges depuis PostgreSQL via `fdw_dossier_credit`. Le wrapper mysql_fdw traduit la requete en protocole MySQL.

### Operations comptables (SQL Server — table distante via tds_fdw)
![Operations](screenshots/05-operations.png)
> Les 120 ecritures comptables issues de SQL Server via `fdw_ecriture_comptable`. Les dates arrivent en VARCHAR(30) et sont converties par TO_DATE().

### Employes et paie (SQL Server — table distante via tds_fdw)
![Employes](screenshots/06-employes.png)
> Requete sur `fdw_bulletin_paie` (SQL Server). Donnees RH accessibles depuis le hub sans duplication.

### Alertes (requetes inter-bases)
![Alertes](screenshots/07-alertes.png)
> Alertes basees sur des requetes croisees : soldes bas (PG), echeances MySQL en retard (via FDW), transactions suspectes.

### Statut FDW (serveurs etrangers et tables distantes)
![Federation](screenshots/08-federation.png)
> Etat des connexions FDW : serveurs `mysql_server` et `mssql_server`, tables distantes importees, nombre de lignes.

### Vue d'ensemble des 3 bases (PostgreSQL + MySQL + SQL Server)
![Database](screenshots/09-database.png)
> Statistiques d'administration : nombre de tables, enregistrements, index, triggers pour chaque SGBD.

### Reconciliation inter-bases (coherence des donnees)
![Reconciliation](screenshots/10-reconciliation.png)
> Verification de l'integrite referencee entre les 3 SGBD : ICF manquants, doublons, credits sans client correspondant.

---

## Administration des SGBD

### Connexion aux bases

```bash
# PostgreSQL Hub
docker exec -it postgres-hub psql -U banque_admin -d banque_hub

# MySQL Credits
docker exec -it mysql-credit mysql -u credit_user -pCr3ditT0g0! banque_credit

# SQL Server Compta
docker exec -it mssql-compta /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P C0mptaT0g0!2025 -C -d banque_compta
```

### Commandes FDW

```sql
-- Lister les serveurs etrangers
SELECT * FROM pg_foreign_server;

-- Lister les tables distantes
SELECT * FROM pg_foreign_table;

-- Afficher les mappings utilisateurs
SELECT * FROM pg_user_mappings;

-- Tester une requete distante
EXPLAIN (VERBOSE) SELECT * FROM fdw_dossier_credit WHERE statut = 'approuve';
```

### Commandes d'administration

```bash
# Rafraichir les vues materialisees
curl -X POST http://localhost:8000/api/dashboard/refresh

# Verifier la sante de tous les SGBD
curl http://localhost:8000/api/health

# Statut de la federation FDW
curl http://localhost:8000/api/federation/status

# Tests
docker exec fastapi-backend pytest -v
```

---

## Schemas des donnees

### PostgreSQL — Hub (5 tables, ~169 enregistrements)

| Table | Lignes | Dependances |
|-------|--------|-------------|
| `agence` | 5 | — |
| `employe` | 10 | FK → agence |
| `client` | 20 | FK → agence, ICF (SHA-256) |
| `compte` | 30 | FK → client (icf) |
| `transaction` | 104 | FK → compte |

### MySQL — Credits & Risque (4 tables, ~105 enregistrements)

| Table | Lignes | Acces FDW |
|-------|--------|-----------|
| `dossier_credit` | 15 | `fdw_dossier_credit` |
| `garantie` | 20 | `fdw_garantie` |
| `echeancier` | 50 | `fdw_echeancier` |
| `scoring` | 20 | `fdw_scoring` |

### SQL Server — Comptabilite & RH (4 tables, ~250 enregistrements)

| Table | Lignes | Acces FDW |
|-------|--------|-----------|
| `plan_comptable` | 60 | `fdw_plan_comptable` |
| `ecriture_comptable` | 120 | `fdw_ecriture_comptable` |
| `bulletin_paie` | 20 | `fdw_bulletin_paie` |
| `operation_agence` | 50 | `fdw_operation_agence` |

---

## Technologies

| Technologie | Version | Role |
|-------------|---------|------|
| PostgreSQL | 16 | SGBD hub avec extensions FDW compilees |
| MySQL | 8.0 | SGBD source (credits, risque) |
| SQL Server | 2022 | SGBD source (compta, RH) |
| mysql_fdw | master | Wrapper FDW MySQL → PostgreSQL |
| tds_fdw | master | Wrapper FDW SQL Server → PostgreSQL (via FreeTDS) |
| FastAPI | 0.110+ | API REST d'administration |
| Prometheus | latest | Monitoring des 3 SGBD |
| Grafana | latest | Dashboards de performance |
| Docker | — | Conteneurisation des SGBD |

---

## Auteurs

**Universite de Lome** — **Departement de Genie Informatique**
**Licence 3** — **UE : Administration des Bases de Donnees**

Projet : Architecture de bases de donnees federees pour l'optimisation des performances d'une banque commerciale au Togo
