# Documentation Générale du Projet

## Système de Bases de Données Fédérées pour une Banque Commerciale au Togo

**Version** : 1.1.0  
**Date** : Mai 2026  
**Stack** : PostgreSQL 16 · MySQL 8.0 · SQL Server 2022 · FastAPI · React 18 · Docker

> **Documents associés** : [README présentation](./README.md) · [Slides orales](./presentation.md) · [Analyse critique](./analyse_critique.md)

---

## Table des Matières

1. [Présentation Générale](#1-présentation-générale)
2. [Architecture Système](#2-architecture-système)
3. [Base de Données PostgreSQL Hub](#3-base-de-données-postgresql-hub)
4. [Base de Données MySQL Credits](#4-base-de-données-mysql-credits)
5. [Base de Données SQL Server Compta](#5-base-de-données-sql-server-compta)
6. [Foreign Data Wrappers (FDW)](#6-foreign-data-wrappers-fdw)
7. [Vues Fédérées et Matérialisées](#7-vues-fédérées-et-matérialisées)
8. [Backend FastAPI](#8-backend-fastapi)
9. [Frontend React](#9-frontend-react)
10. [Monitoring Prometheus et Grafana](#10-monitoring-prometheus-et-grafana)
11. [Déploiement Docker](#11-déploiement-docker)
12. [Guide de Démarrage Rapide](#12-guide-de-démarrage-rapide)
13. [Erreurs Rencontrées et Résolutions](#13-erreurs-rencontrées-et-résolutions)
14. [Bonnes Pratiques et Conventions](#14-bonnes-pratiques-et-conventions)
15. [Tests et Validation](#15-tests-et-validation)
16. [Annexes](#16-annexes)

---

## 1. Présentation Générale

### 1.1 Contexte

Une banque commerciale togolaise exploite trois systèmes de gestion de bases de données hétérogènes :

- **PostgreSQL** — données opérationnelles (clients, comptes, transactions, agences, employés)
- **MySQL** — gestion des crédits et évaluation des risques (dossiers de prêt, garanties, échéanciers, scoring)
- **SQL Server** — comptabilité et ressources humaines (plan comptable OHADA, écritures comptables, bulletins de paie, opérations par agence)

Ces trois bases fonctionnent de manière isolée, sans vue unifiée des données.

### 1.2 Objectif

Fédérer ces trois SGBD hétérogènes en un système cohérent où :

- Le **PostgreSQL Hub** centralise l'accès aux données des trois bases via des Foreign Data Wrappers (FDW)
- Le **Backend FastAPI** expose une API REST unifiée pour toutes les opérations
- Le **Frontend React** offre une interface utilisateur moderne et réactive
- Le **Monitoring Prometheus + Grafana** assure l'observabilité de l'ensemble

### 1.3 Normes et Standards

- **OHADA** — Organisation pour l'Harmonisation en Afrique du Droit des Affaires (plan comptable)
- **BCEAO/UEMOA** — Banque Centrale des États de l'Afrique de l'Ouest (normes bancaires)
- **Langue** — 100% français (interface, documentation, rapports)

### 1.4 Technologies Clés

| Couche | Technologie | Version |
|--------|-------------|---------|
| Hub central | PostgreSQL | 16 + mysql_fdw + tds_fdw |
| Crédits | MySQL | 8.0 |
| Comptabilité/RH | SQL Server | 2022 |
| Backend | FastAPI + Python | 3.12 |
| ORM | SQLAlchemy (async) | 2.0.25+ |
| Frontend | React + Vite | 18 / 5 |
| CSS | Tailwind CSS | 4 |
| Graphiques | Recharts | 2.12 |
| Icônes | lucide-react | 0.330 |
| Conteneurisation | Docker Compose | v2 |
| Monitoring | Prometheus + Grafana | latest |

---

## 2. Architecture Système

### 2.1 Vue d'Ensemble

Le système se compose de **10 conteneurs Docker** interconnectés sur un réseau partagé :

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────────┐
│   React         │────▶│   FastAPI        │────▶│   PostgreSQL Hub     │
│   Frontend      │     │   Backend        │     │   + FDW              │
│   Port 3000     │     │   Port 8000      │     │   Port 5432 (interne)│
└─────────────────┘     └──────────────────┘     └──────────┬───────────┘
                                                             │
                                       ┌─────────────────────┼─────────────────────┐
                                       │                     │                     │
                                ┌──────▼──────┐       ┌──────▼──────┐       ┌─────▼──────┐
                                │   MySQL     │       │  SQL Server │       │ Prometheus │
                                │   Crédits   │       │  Compta/RH  │       │ + Grafana  │
                                │   Port 3306 │       │  Port 1433  │       │ + cAdvisor │
                                └─────────────┘       └─────────────┘       └────────────┘
```

### 2.2 Services et Ports

| Service | Nom Conteneur | Port Hôte | Port Interne | Health Check |
|---------|--------------|-----------|--------------|--------------|
| PostgreSQL Hub | `postgres-hub` | 5435 | 5432 | `pg_isready` |
| MySQL Credits | `mysql-credit` | 3308 | 3306 | `mysqladmin ping` |
| SQL Server Compta | `mssql-compta` | 1435 | 1433 | `sqlcmd SELECT 1` |
| FastAPI Backend | `fastapi-backend` | 8000 | 8000 | `curl /api/health` |
| React Frontend | `react-frontend` | 3000 | 3000 | — |
| Prometheus | `prometheus` | 9090 | 9090 | — |
| Grafana | `grafana` | 3001 | 3001 | — |
| PostgreSQL Exporter | `postgres-exporter` | 9187 | 9187 | — |
| MySQL Exporter | `mysql-exporter` | 9104 | 9104 | — |
| cAdvisor | `cadvisor` | **8081** | 8080 | — |

> **Note importante** : Les ports hôtes 5435, 3308 et 1435 sont différents des ports par défaut (5432, 3306, 1433) pour éviter les conflits avec d'éventuelles instances locales de bases de données.

### 2.3 Architecture Réseau

Tous les conteneurs sont connectés à un réseau Docker nommé `reseau-banque`. La communication interne se fait via les noms de conteneur (ex: `postgres-hub`, `mysql-credit`, `mssql-compta`).

---

## 3. Base de Données PostgreSQL Hub

### 3.1 Rôle

PostgreSQL est le **hub central** du système fédéré. Il contient :

1. Les **données locales** : agences, employés, clients, comptes, transactions
2. Les **foreign tables** pointant vers MySQL et SQL Server (via FDW)
3. Les **vues fédérées** combinant données locales et distantes
4. Les **vues matérialisées** pour les indicateurs de performance

### 3.2 Tables Locales

| Table | Lignes | Description |
|-------|--------|-------------|
| `agence` | 5 | Succursales (Lomé, Kpalimé, Sokodé, Kara, Dapaong) |
| `employe` | 10 | Employés (2 par agence) |
| `client` | 20 | Clients bancaires avec ICF SHA-256 |
| `compte` | 30 | Comptes (courant, épargne, terme) |
| `transaction` | 104 | Opérations bancaires |

### 3.3 Identifiant Client Faible (ICF)

L'ICF est un identifiant unique généré par **SHA-256** :

```
ICF = SHA-256(numero_piece + "TOGO_BK001")
```

- Entrée : numéro de pièce d'identité du client + chaîne de signature `"TOGO_BK001"`
- Sortie : 64 caractères hexadécimaux
- Usage : permet de détecter les doublons clients sans stocker de données sensibles en clair

### 3.4 Initialisation

Les scripts d'initialisation se trouvent dans `postgres-hub/init/` :

- `01_create_extensions.sql` — active `mysql_fdw` et `tds_fdw`
- `02_create_tables.sql` — création des tables locales
- `03_create_indexes.sql` — index sur ICF, clés étrangères
- `04_create_fdw_servers.sql` — configuration des serveurs FDW
- `05_create_foreign_tables.sql` — déclaration des foreign tables
- `06_create_federated_views.sql` — création des vues fédérées
- `07_create_materialized_views.sql` — création des vues matérialisées

Les données de seed sont dans `postgres-hub/seed/seed_postgres.sql` et sont **idempotentes** (utilisent `TRUNCATE ... RESTART IDENTITY CASCADE`).

---

## 4. Base de Données MySQL Credits

### 4.1 Rôle

MySQL gère les données relatives aux **crédits et à l'évaluation des risques** clients.

### 4.2 Tables

| Table | Lignes | Description |
|-------|--------|-------------|
| `dossier_credit` | 15 | Demandes de prêt avec montant, durée, statut |
| `garantie` | 20 | Garanties associées aux dossiers (type, valeur) |
| `echeancier` | 50 | Échéanciers de remboursement (montant, date, statut) |
| `scoring` | 20 | Scores de risque (0-100) déterminant le niveau de risque |

### 4.3 Trigger de Scoring

Un trigger `trg_determiner_niveau_risque` sur la table `scoring` détermine automatiquement le niveau de risque (`faible`, `moyen`, `eleve`, `tres_eleve`) en fonction du score numérique :

- Score ≥ 80 → `faible`
- Score ≥ 60 → `moyen`
- Score ≥ 40 → `eleve`
- Score < 40 → `tres_eleve`

### 4.4 Initialisation

Scripts dans `mysql-credit/init/` :

- `01_create_tables.sql` — création des tables MySQL
- `02_create_user.sql` — création de l'utilisateur pour la connexion FDW
- `03_seed_mysql.sql` — données de seed

---

## 5. Base de Données SQL Server Compta

### 5.1 Rôle

SQL Server gère les données **comptables (normes OHADA) et RH** de la banque.

### 5.2 Tables

| Table | Lignes | Description |
|-------|--------|-------------|
| `plan_comptable` | 60 | Plan comptable OHADA (classe 1 à 8) |
| `ecriture_comptable` | 120 | Écritures comptables (débit/crédit) |
| `bulletin_paie` | 20 | Bulletins de salaire des employés |
| `operation_agence` | 50 | Opérations par agence avec montant |

### 5.3 Contraintes

- `CHECK (montant > 0)` sur `operation_agence` — pas de montant nul ou négatif
- Clés étrangères entre `operation_agence` et `bulletin_paie`

### 5.4 Initialisation

Scripts dans `mssql-compta/init/` et `mssql-compta/seed/` :

- `01_create_tables.sql` — création des tables SQL Server
- `02_create_user.sql` — création de l'utilisateur FDW
- Le seed est exécuté via `entrypoint.sh` avec `|| true` pour ignorer les erreurs de doublons

---

## 6. Foreign Data Wrappers (FDW)

### 6.1 Principe

Les Foreign Data Wrappers sont des extensions PostgreSQL qui permettent d'accéder à des données distantes comme si elles étaient des tables locales.

### 6.2 mysql_fdw — Connexion à MySQL

**Extension** : `mysql_fdw`

**Serveur FDW** :

```sql
CREATE SERVER mysql_server
FOREIGN DATA WRAPPER mysql_fdw
OPTIONS (host 'mysql-credit', port '3306');
```

**Foreign tables** (chacune avec `dbname` dans ses options) :

```sql
CREATE FOREIGN TABLE fdw_dossier_credit (
    id INTEGER,
    id_client VARCHAR(64),
    montant DECIMAL(15,2),
    duree_mois INTEGER,
    statut VARCHAR(20),
    date_demande DATE
)
SERVER mysql_server
OPTIONS (dbname 'banque_credit', table_name 'dossier_credit');
```

**Particularité** : L'option `dbname` n'est pas supportée au niveau du serveur FDW MySQL. Elle doit être déclarée dans chaque foreign table.

### 6.3 tds_fdw — Connexion à SQL Server

**Extension** : `tds_fdw` (via FreeTDS)

**Serveur FDW** :

```sql
CREATE SERVER mssql_server
FOREIGN DATA WRAPPER tds_fdw
OPTIONS (host 'mssql-compta', port '1433', database 'banque_compta');
```

**Foreign tables avec conversion de dates** :

```sql
CREATE FOREIGN TABLE fdw_ecriture_comptable (
    id INTEGER,
    id_operation INTEGER,
    compte VARCHAR(20),
    debit DECIMAL(15,2),
    credit DECIMAL(15,2),
    date_ecriture VARCHAR(30),    -- ← VARCHAR(30), pas DATE
    date_saisie VARCHAR(30)       -- ← VARCHAR(30), pas TIMESTAMP
)
SERVER mssql_server
OPTIONS (table_name 'ecriture_comptable');
```

**Problème connu** : tds_fdw retourne les dates SQL Server au format chaîne `Jan 10 2024 12:00:00:AM` qui n'est pas parseable par PostgreSQL. La solution est de :

1. Déclarer les colonnes en `VARCHAR(30)` dans les foreign tables
2. Convertir avec `TO_DATE()` dans les vues :

```sql
TO_DATE(ec.date_ecriture, 'Mon DD YYYY HH12:MI:SS:AM')
```

### 6.4 Liste des Foreign Tables

| Foreign Table | Source | Lignes |
|---------------|--------|--------|
| `fdw_dossier_credit` | MySQL `dossier_credit` | 15 |
| `fdw_garantie` | MySQL `garantie` | 20 |
| `fdw_echeancier` | MySQL `echeancier` | 50 |
| `fdw_scoring` | MySQL `scoring` | 20 |
| `fdw_ecriture_comptable` | SQL Server `ecriture_comptable` | 120 |
| `fdw_plan_comptable` | SQL Server `plan_comptable` | 60 |
| `fdw_bulletin_paie` | SQL Server `bulletin_paie` | 20 |
| `fdw_operation_agence` | SQL Server `operation_agence` | 50 |

### 6.5 Initialisation Différée

Les scripts FDW sont exécutés dans `post-init.sh` (pas dans `/docker-entrypoint-initdb.d/`) car :

1. PostgreSQL démarre avant MySQL et SQL Server
2. Le script `post-init.sh` attend que les deux bases distantes soient prêtes
3. Puis il configure les serveurs FDW, foreign tables et vues

---

## 7. Vues Fédérées et Matérialisées

### 7.1 Principe

Les vues fédérées combinent des données issues de plusieurs bases (locale + foreign tables) pour offrir une vue unifiée.

### 7.2 Vues Fédérées

#### vue_client_complet

Profils clients unifiés avec leur score de risque :

```
client (PG) + fdw_scoring (MySQL)
```

| Colonne | Source |
|---------|--------|
| icf, nom, prenom, email, telephone | PostgreSQL `client` |
| niveau_risque, score | MySQL `scoring` (via FDW) |

#### vue_credit_detail

Dossiers de crédit complets avec garanties :

```
compte (PG) + fdw_dossier_credit (MySQL) + fdw_garantie (MySQL)
```

#### vue_operation_comptable

Opérations bancaires avec écritures comptables (OHADA) :

```
transaction (PG) + fdw_operation_agence (SQL Server) + fdw_ecriture_comptable (SQL Server)
```

Utilise `TO_DATE()` pour convertir les dates SQL Server.

#### vue_tableau_bord

Indicateurs clés de performance par agence :

```
agence (PG) + fdw_scoring (MySQL) + fdw_operation_agence (SQL Server)
```

### 7.3 Vues Matérialisées

#### mv_tableau_bord

Version mise en cache de `vue_tableau_bord` pour des performances optimales. Rafraîchie à la demande via l'endpoint `POST /api/dashboard/refresh`.

#### mv_clients_risque_eleve

Liste des clients classés `eleve` ou `tres_eleve` — utilisée pour les alertes et le dashboard risque.

---

## 8. Backend FastAPI

### 8.1 Architecture

```
backend/app/
├── main.py              # Point d'entrée FastAPI, métriques Prometheus
├── config.py            # Configuration via pydantic-settings (.env)
├── database.py          # Moteurs async (asyncpg, aiomysql)
├── exceptions.py        # Gestion centralisée des erreurs
├── models/              # Modèles SQLAlchemy (5 fichiers)
├── routers/             # Routeurs API (9 fichiers)
├── schemas/             # Schémas Pydantic (9 fichiers)
├── services/            # Logique métier (7 fichiers)
└── utils/
    └── icf_generator.py # Génération SHA-256
```

### 8.2 Stack Technique

- **Python** 3.12
- **FastAPI** (framework web asynchrone) avec Uvicorn
- **SQLAlchemy 2.0** (ORM asynchrone)
- **asyncpg** (driver PostgreSQL)
- **aiomysql** (driver MySQL)
- **Pydantic v2** (validation des données)
- **prometheus-fastapi-instrumentator** (métriques)

### 8.3 Sessions de Base de Données

Le système utilise deux sessions distinctes :

```python
# Session PostgreSQL (async)
async def get_pg_session():
    async with AsyncSession(pg_engine) as session:
        yield session

# Session MySQL (async)
async def get_mysql_session():
    async with AsyncSession(mysql_engine) as session:
        yield session
```

> **Important** : L'option `pool_pre_ping=True` n'est PAS utilisée car elle est incompatible avec les drivers asyncpg et aiomysql (erreur `missing 1 required positional argument: 'reconnect'`).

### 8.4 Routeurs API

#### Santé et Fédération
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/health` | Statut des 3 bases de données |
| GET | `/api/federation/status` | État des connexions FDW |

#### Clients
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/clients` | Liste paginée avec recherche et filtres |
| GET | `/api/clients/{icf}` | Détail d'un client par ICF |
| POST | `/api/clients` | Création avec génération automatique ICF |

#### Comptes
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/comptes/` | Liste des comptes |
| GET | `/api/comptes/stats` | Statistiques (par type, par agence) |
| GET | `/api/comptes/{id}` | Détail d'un compte |
| POST | `/api/comptes/` | Création d'un compte |
| PUT | `/api/comptes/{id}/statut` | Mise à jour du statut |
| GET | `/api/comptes/{id}/transactions` | Historique des transactions |

#### Crédits
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/credits` | Liste des dossiers de crédit |
| GET | `/api/credits/{id}` | Détail d'un dossier |
| GET | `/api/credits/{id}/echeancier` | Échéancier d'un crédit |
| POST | `/api/credits` | Création d'une demande |
| PUT | `/api/credits/{id}/decision` | Approbation/rejet |
| PUT | `/api/credits/{id}/echeancier/{id}/statut` | Mise à jour d'une échéance |
| POST | `/api/credits/{id}/garanties` | Ajout d'une garantie |
| POST | `/api/credits/{id}/scoring` | Ajout d'un score de risque |

#### Opérations
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/operations` | Liste des opérations comptables |
| POST | `/api/operations/transactions` | Création d'une transaction |

#### Dashboard
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/dashboard` | KPIs globaux |
| GET | `/api/dashboard/agence/{id}` | KPIs par agence |
| GET | `/api/dashboard/risque` | Clients à risque élevé |
| POST | `/api/dashboard/refresh` | Rafraîchissement des vues matérialisées |

#### Employés et Paie
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/employes/` | Liste des employés |
| GET | `/api/employes/paie/` | Bulletins de salaire |
| GET | `/api/employes/paie/stats` | Statistiques de paie |

#### Alertes
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/alertes/` | Toutes les alertes |
| GET | `/api/alertes/resume` | Résumé des alertes |
| GET | `/api/alertes/solde-bas` | Alertes de soldes bas |
| GET | `/api/alertes/echeances-retard` | Échéances en retard |
| GET | `/api/alertes/transactions-suspectes` | Transactions suspectes |

#### Réconciliation
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/reconciliation/rapport` | Rapport de cohérence ICF |
| GET | `/api/reconciliation/comptes-credits` | Cohérence comptes/crédits |
| GET | `/api/reconciliation/doublons-icf` | Détection de doublons ICF |
| POST | `/api/reconciliation/refresh` | Réconciliation complète |

#### Base de Données
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/database/postgres` | Informations PostgreSQL |
| GET | `/api/database/mysql` | Informations MySQL |
| GET | `/api/database/mssql` | Informations SQL Server (via FDW) |
| GET | `/api/database/overview` | Vue combinée des 3 bases |
| POST | `/api/database/query` | Exécution SELECT (lecture seule) |
| POST | `/api/database/refresh-views` | Rafraîchissement vues matérialisées |

### 8.5 Gestion des Erreurs

Les exceptions personnalisées sont définies dans `exceptions.py` :

- `NotFoundException` — ressource non trouvée (404)
- `BadRequestException` — requête invalide (400)
- `DatabaseException` — erreur base de données (500)
- `FDWException` — erreur de connexion FDW (503)

Toutes les erreurs retournent une réponse JSON structurée avec code, message en français, et statut HTTP.

### 8.6 Métriques Prometheus

Le backend expose des métriques personnalisées sur `/metrics` :

```python
# Gauge : nombre de connexions DB actives
db_connections_gauge = Gauge('db_connections_active', 'Connexions DB actives')

# Counter : nombre de requêtes par type
db_query_counter = Counter('db_queries_total', 'Total requêtes', ['type'])

# Histogram : durée des requêtes
db_query_duration = Histogram('db_query_duration_seconds', 'Durée des requêtes', ['type'])

# Gauge : statut des connexions FDW
fdw_status_gauge = Gauge('fdw_connection_status', 'Statut FDW', ['source'])
```

---

## 9. Frontend React

### 9.1 Architecture

```
frontend/src/
├── App.jsx               # 16 routes, navigation latérale
├── api/index.js          # Client Axios (tous les endpoints)
├── components/           # Composants réutilisables
│   ├── Badge.jsx
│   ├── ErrorMessage.jsx
│   ├── FormatCurrency.jsx
│   ├── LoadingSpinner.jsx
│   └── StatCard.jsx
├── pages/                # 17 pages (dont MonitoringPage)
│   ├── DashboardPage.jsx
│   ├── ClientsPage.jsx
│   ├── ClientDetailPage.jsx
│   ├── ClientFormPage.jsx
│   ├── ComptesPage.jsx
│   ├── CreditsPage.jsx
│   ├── CreditDetailPage.jsx
│   ├── CreditFormPage.jsx
│   ├── EcheanciersPage.jsx
│   ├── OperationsPage.jsx
│   ├── TransactionFormPage.jsx
│   ├── EmployesPage.jsx
│   ├── AlertesPage.jsx
│   ├── ReconciliationPage.jsx
│   ├── FederationPage.jsx
│   ├── DatabasePage.jsx
│   └── MonitoringPage.jsx
└── utils/
    └── export.js          # Export CSV
```

### 9.2 Stack

- **React 18** — composants fonctionnels avec hooks
- **Vite 5** — build tool
- **Tailwind CSS 4** — styles utilitaires avec plugin `@tailwindcss/vite`
- **Recharts 2.12** — graphiques
- **lucide-react 0.330** — icônes
- **Axios** — client HTTP

### 9.3 Pages et Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | KPIs, graphiques, résumé par agence |
| `/clients` | Clients | Liste avec pagination et filtres |
| `/clients/:icf` | ClientDetail | Détail 360° (comptes, crédits) |
| `/comptes` | Comptes | Gestion des comptes |
| `/credits` | Credits | Liste des dossiers de crédit |
| `/credits/:id` | CreditDetail | Détail dossier + échéancier |
| `/echeanciers` | Echeanciers | Gestion des échéanciers |
| `/operations` | Operations | Liste des opérations |
| `/employes` | Employes | Employés et paie |
| `/alertes` | Alertes | Dashboard d'alertes |
| `/reconciliation` | Reconciliation | Cohérence des données |
| `/federation` | Federation | Statut FDW |
| `/database` | Database | Gestion des bases |
| `/monitoring` | Monitoring | Métriques Prometheus |
| `/new-client` | ClientForm | Création client |
| `/new-credit` | CreditForm | Création crédit |
| `/new-transaction` | TransactionForm | Création transaction |

### 9.4 Composants Réutilisables

- **`FormatCurrency`** — format monétaire XOF (espace insécable, 2 décimales)
- **`LoadingSpinner`** — indicateur de chargement
- **`ErrorMessage`** — affichage d'erreur avec bouton réessayer
- **`StatCard`** — carte de statistique avec icône, valeur, label
- **`Badge`** — badge coloré (statut, niveau de risque)

### 9.5 Conventions d'Interface

- 100% français (libellés, messages, placeholders)
- Fond blanc (`bg-white`) sur toutes les pages
- Pas de mode sombre
- Icônes lucide-react v0.330 :
  - `Bell` au lieu de `BellAlert` (inexistant)
  - `UserCheck` au lieu de `UsersRound` (inexistant)

### 9.6 API Client

Tous les appels API passent par `api/index.js` qui utilise Axios avec `baseURL` configuré via `VITE_API_URL` :

```
VITE_API_URL=http://localhost:8000/api
```

> **Attention** : La variable doit impérativement inclure le suffixe `/api`.

---

## 10. Monitoring Prometheus et Grafana

### 10.1 Architecture de Monitoring

```
┌──────────────────┐     ┌──────────────┐     ┌──────────┐
│  FastAPI         │────▶│  Prometheus  │────▶│  Grafana │
│  /metrics        │     │  Port 9090   │     │  Port 3001│
├──────────────────┤     └──────┬───────┘     └──────────┘
│  PostgreSQL Exp  │────────────┤
│  Port 9187       │            │
├──────────────────┤            │
│  MySQL Exp       │────────────┤
│  Port 9104       │            │
├──────────────────┤            │
│  cAdvisor        │────────────┤
│  Port 8080       │            │
└──────────────────┘            │
                       ┌────────┴────────┐
                       │  4 cibles       │
                       │  scrape interval │
                       │  : 15s          │
                       └─────────────────┘
```

### 10.2 Cibles Prometheus

| Cible | Port | Métriques collectées |
|-------|------|----------------------|
| FastAPI | 8000 | Requêtes/min, latence, connexions DB, statut FDW |
| PostgreSQL Exporter | 9187 | Connexions, transactions, taille des bases |
| MySQL Exporter | 9104 | Connexions, requêtes, statut InnoDB |
| cAdvisor | **8081** (hôte) → 8080 (conteneur) | CPU, mémoire, réseau, disque des conteneurs |

### 10.3 Métriques Personnalisées

Le backend FastAPI expose sur `/metrics` :

- `db_connections_active` (Gauge) — connexions actives aux bases
- `db_queries_total` (Counter) — requêtes par type (SELECT, INSERT, etc.)
- `db_query_duration_seconds` (Histogram) — distribution des durées de requêtes
- `fdw_connection_status` (Gauge) — 1 si FDW connecté, 0 sinon

### 10.4 Grafana

**Accès** : `http://localhost:3001`  
**Identifiants** : `admin` / `Grafana2025!`

**Provisioning automatique** : les datasources (Prometheus) et dashboards sont chargés automatiquement au démarrage via :

- `grafana/provisioning/datasources/datasource.yml`
- `grafana/provisioning/dashboards/dashboards.yml`
- `grafana/dashboards/api-dashboard.json`

**Dashboard API** (6 panneaux) :

1. **Requêtes par minute** — taux de requêtes HTTP
2. **Latence des requêtes** — P50, P95, P99
3. **Connexions DB actives** — nombre de connexions PostgreSQL/MySQL
4. **Statut des connexions FDW** — connecté/déconnecté
5. **Ressources conteneurs** — CPU/Mémoire via cAdvisor
6. **Santé des bases** — disponibilité PostgreSQL, MySQL, SQL Server

---

## 11. Déploiement Docker

### 11.1 Fichier docker-compose.yml

Le fichier `docker-compose.yml` à la racine définit 10 services interconnectés :

```yaml
version: '3.8'
services:
  postgres-hub:
    build: ./postgres-hub
    ports: ["5435:5432"]
    environment:
      POSTGRES_DB: banque_federated
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    networks: [reseau-banque]

  mysql-credit:
    build: ./mysql-credit
    ports: ["3308:3306"]
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
    networks: [reseau-banque]

  mssql-compta:
    build: ./mssql-compta
    ports: ["1435:1433"]
    environment:
      MSSQL_SA_PASSWORD: ${MSSQL_SA_PASSWORD}
    networks: [reseau-banque]

  fastapi-backend:
    build: ./backend
    ports: ["8000:8000"]
    environment:
      POSTGRES_HOST: postgres-hub
      MYSQL_HOST: mysql-credit
    depends_on: [postgres-hub]
    networks: [reseau-banque]

  react-frontend:
    build: ./frontend
    ports: ["3000:3000"]
    depends_on: [fastapi-backend]
    networks: [reseau-banque]

  prometheus:
    image: prom/prometheus
    ports: ["9090:9090"]
    volumes: [./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml]
    networks: [reseau-banque]

  grafana:
    image: grafana/grafana
    ports: ["3001:3001"]
    volumes: [./grafana/provisioning:/etc/grafana/provisioning]
    networks: [reseau-banque]

  postgres-exporter:
    image: prometheuscommunity/postgres-exporter
    ports: ["9187:9187"]
    environment:
      DATA_SOURCE_NAME: postgresql://...
    networks: [reseau-banque]

  mysql-exporter:
    image: prom/mysqld-exporter
    ports: ["9104:9104"]
    environment:
      DATA_SOURCE_NAME: user:password@/...
    networks: [reseau-banque]

  cadvisor:
    image: gcr.io/cadvisor/cadvisor
    ports: ["8080:8080"]
    volumes: [...]
    networks: [reseau-banque]

networks:
  reseau-banque:
    driver: bridge
```

### 11.2 Ordre de Démarrage

1. **MySQL** et **SQL Server** démarrent en premier (création des tables + seed)
2. **PostgreSQL** démarre ensuite (scripts init + tables locales)
3. **post-init.sh** attend que MySQL et SQL Server soient disponibles
4. Puis configure les serveurs FDW, foreign tables et vues
5. **FastAPI** démarre après PostgreSQL
6. **React** démarre après FastAPI
7. **Prometheus**, **Grafana** et les **exporters** démarrent en parallèle

### 11.3 Dockerfiles

#### postgres-hub/Dockerfile
- Base : `postgres:16`
- Extensions compilées : `mysql_fdw`, `tds_fdw` (depuis les sources GitHub)
- Scripts init, FDW init, seed et post-init copiés dans l'image
- Point d'entrée personnalisé : `docker-entrypoint-wrapper.sh`

#### mysql-credit/Dockerfile
- Base : `mysql:8.0`
- Configuration : `my.cnf` pour charset UTF-8
- Scripts init et seed copiés dans `/docker-entrypoint-initdb.d/`

#### mssql-compta/Dockerfile
- Base : `mssql/server:2022-latest`
- Scripts init et seed copiés dans `/scripts/`
- `entrypoint.sh` personnalisé qui :
  1. Démarre SQL Server
  2. Exécute les scripts init
  3. Exécute le seed (en ignorant les erreurs)
  > **Ordre USER** : `USER mssql` doit être APRÈS les étapes COPY et chmod +x

#### backend/Dockerfile
- Base : `python:3.12-slim`
- Installation des dépendances depuis `requirements.txt`
- Exposition du port 8000
- Démarrage : `uvicorn app.main:app --host 0.0.0.0 --port 8000`

#### frontend/Dockerfile
- Base : `node:20-alpine`
- Installation des dépendances npm
- Build Vite + serveur Nginx statique
- Exposition du port 3000

---

## 12. Guide de Démarrage Rapide

### 12.1 Prérequis

- Docker Compose v2 ou supérieur
- Ports libres : 5435, 3308, 1435, 8000, 3000, 9090, 3001, 9187, 9104, **8081**
- Git

### 12.2 Installation et Démarrage

```bash
# Cloner le projet
git clone <url-du-projet>
cd projet_fin_dba

# Créer le fichier .env à partir du modèle
cp .env.example .env
# Éditer .env avec les bonnes valeurs

# Démarrer tous les services
docker compose up -d --build

# Vérifier que tout est OK
docker compose ps
# Tous les services doivent être "Up"

# Vérifier les logs (attendre l'initialisation FDW)
docker compose logs -f postgres-hub

# Tester l'API
curl http://localhost:8000/api/health

# Accéder aux interfaces
# - Frontend : http://localhost:3000
# - API Swagger : http://localhost:8000/docs
# - Grafana : http://localhost:3001 (admin / Grafana2025!)
# - Prometheus : http://localhost:9090
```

### 12.3 Commandes Utiles

```bash
# Arrêter tous les services
docker compose down

# Arrêter et tout reconstruire
docker compose down && docker compose up -d --build

# Voir les logs d'un service
docker compose logs -f fastapi-backend

# Exécuter une commande dans un conteneur
docker exec -it postgres-hub psql -U admin -d banque_federated

# Exécuter les tests
docker exec fastapi-backend pytest -v

# Vérification système complète
bash scripts/verify-all.sh
```

### 12.4 Accès aux Bases de Données

```bash
# PostgreSQL Hub (port hôte 5435)
psql -h localhost -p 5435 -U admin -d banque_federated

# MySQL Credits (port hôte 3308)
mysql -h localhost -P 3308 -u admin -p banque_credit

# SQL Server Compta (port hôte 1435)
sqlcmd -S localhost,1435 -U sa -P '<password>'
```

---

## 13. Erreurs Rencontrées et Résolutions

### 13.1 Résumé

| Catégorie | Total | Résolues | Critiques | Hautes |
|-----------|-------|----------|-----------|--------|
| Docker / Infrastructure | 3 | 3 | 1 | 1 |
| PostgreSQL / FDW | 3 | 3 | 1 | 2 |
| MySQL | 2 | 2 | 1 | 0 |
| SQL Server | 2 | 2 | 0 | 0 |
| Backend FastAPI | 2 | 2 | 0 | 1 |
| Frontend React | 1 | 1 | 0 | 1 |
| Fédération / Vues | 1 | 1 | 0 | 1 |
| Données / Seed | 1 | 1 | 0 | 1 |
| **TOTAL** | **15** | **15** | **3** | **6** |

### 13.2 Erreurs Docker et Infrastructure

#### ERR-001 — Permission chmod dans mssql-compta
- **Problème** : `chmod +x /scripts/entrypoint.sh` échoue car l'utilisateur `mssql` n'a pas les droits root
- **Cause** : `USER mssql` déclaré avant les étapes COPY et chmod
- **Solution** : Déplacer `USER mssql` après les étapes de COPY et chmod +x

#### ERR-003 — Ports par défaut occupés
- **Problème** : `address already in use` sur les ports 5432, 3306, 1433
- **Cause** : Instances locales de PostgreSQL, MySQL et SQL Server
- **Solution** : Mapping vers 5435, 3308, 1435

#### ERR-005 — Résolution DNS entre conteneurs
- **Problème** : `socket.gaierror` — PostgreSQL ne trouve pas les noms d'hôte des autres conteneurs
- **Cause** : Conteneurs sur différents réseaux Docker
- **Solution** : `docker compose down && docker compose up -d`

#### ERR-008 — Scripts de seed non exécutés
- **Problème** : Les scripts de seed ne sont pas copiés dans les images Docker, bases vides
- **Cause** : Dockerfiles ne copient pas les dossiers de seed
- **Solution** : Ajout de COPY seed/ dans chaque Dockerfile, renommage pour MySQL

### 13.3 Erreurs FDW et Fédération

#### ERR-004 — Option dbname invalide pour mysql_fdw
- **Problème** : `ERROR: invalid option "dbname"` lors de la création du serveur FDW
- **Cause** : `dbname` non supporté au niveau serveur par mysql_fdw
- **Solution** : Déplacer `dbname` dans les options de chaque FOREIGN TABLE

#### ERR-009 — FDW non initialisés après restart
- **Problème** : Foreign tables absentes après `docker compose down -v`
- **Cause** : Les scripts `/docker-entrypoint-initdb.d/` ne s'exécutent qu'au premier démarrage
- **Solution** : Script `post-init.sh` exécuté en arrière-plan après le démarrage de PostgreSQL

#### ERR-014 — Format de date SQL Server via tds_fdw
- **Problème** : `InvalidDatetimeFormatError` — dates au format `Jan 10 2024 12:00:00:AM`
- **Cause** : tds_fdw retourne les dates SQL Server comme des chaînes non parseables
- **Solution** : Colonnes en `VARCHAR(30)` dans les foreign tables + `TO_DATE()` dans les vues

### 13.4 Erreurs Backend et Frontend

#### ERR-010 — pool_pre_ping incompatible
- **Problème** : `ping() missing 1 required positional argument: 'reconnect'`
- **Cause** : Incompatibilité entre SQLAlchemy 2.0.25+ et asyncpg/aiomysql
- **Solution** : Retrait de `pool_pre_ping=True`, health check via requête directe

#### ERR-011 — Tests pytest async
- **Problème** : `PytestRemovedIn9Warning` + `RuntimeError: Event loop is closed`
- **Cause** : Fixtures async non décorées, asyncio_mode non configuré
- **Solution** : `pytest.ini` avec `asyncio_mode = auto`, fixtures centralisées dans `conftest.py`

#### ERR-013 — Frontend sans préfixe /api
- **Problème** : Requêtes vers `/health` au lieu de `/api/health` (404)
- **Cause** : `VITE_API_URL` sans `/api`
- **Solution** : `VITE_API_URL=http://localhost:8000/api`

### 13.5 Erreurs de Données

#### ERR-002 — Ordre de création du trigger MySQL
- Trigger créé avant la table `scoring` → inversion dans le script SQL

#### ERR-006 — ICF trop longs
- 65 caractères hexadécimaux pour `CHAR(64)` → troncature avec `sed`

#### ERR-007 — Montant nul dans SQL Server
- `montant = 0.00` viole `CHECK(montant > 0)` → remplacé par 1.00

#### ERR-012 — Table transaction vide
- Auto-incrément des comptes commence à 31 → violations FK
- Solution : `TRUNCATE ... RESTART IDENTITY CASCADE`

#### ERR-015 — Violation PK plan_comptable
- Seed exécuté deux fois → doublons sur `plan_comptable`
- Solution : Ignorer l'erreur avec `|| true`

---

## 14. Bonnes Pratiques et Conventions

### 14.1 Backend

- **Async partout** : `async/await` avec SQLAlchemy async engines
- **Pas de `pool_pre_ping`** : incompatible avec asyncpg/aiomysql
- **Requêtes SQL** : utiliser `sqlalchemy.text()` pour le SQL brut
- **Pydantic v2** : utiliser `model_dump()` de préférence à `dict()`
- **Gestion des sessions** : dépendances `get_pg_session()` / `get_mysql_session()`
- **ICF** : SHA-256 de `numero_piece + "TOGO_BK001"`, 64 caractères

### 14.2 Frontend

- **Fonctionnel** : composants React avec hooks, pas de classes
- **Tailwind v4** : plugin `@tailwindcss/vite`
- **lucide-react 0.330** : vérifier les noms d'icônes (pas de `BellAlert` ni `UsersRound`)
- **Format monétaire** : toujours utiliser `FormatCurrency` (XOF)
- **Fond blanc** : `bg-white` sur toutes les pages
- **Français** : 100% de l'interface

### 14.3 Base de Données

- **Dates SQL Server** : `VARCHAR(30)` dans les foreign tables, `TO_DATE()` dans les vues
- **Seed idempotent** : PostgreSQL utilise `TRUNCATE ... RESTART IDENTITY CASCADE`
- **FDW différé** : `post-init.sh` attend MySQL et SQL Server
- **Requêtes SELECT seulement** : l'endpoint `/api/database/query` bloque les écritures

### 14.4 Docker

- **Ports hôtes** : 5435 (PG), 3308 (MySQL), 1435 (MSSQL)
- **Ordre USER** : toujours après COPY et chmod dans les Dockerfiles
- **Initialisation différée** : PostgreSQL dépend de MySQL et SQL Server pour les FDW

---

## 15. Tests et Validation

### 15.1 Tests Backend

**Framework** : pytest avec `asyncio_mode = auto`

```bash
# Exécuter tous les tests
docker exec fastapi-backend pytest -v

# Test spécifique
docker exec fastapi-backend pytest tests/test_clients.py -v

# Avec couverture
docker exec fastapi-backend pytest --cov=app
```

**Fixtures** : centralisées dans `conftest.py` avec `@pytest_asyncio.fixture` :
- `client` — client HTTP de test (httpx.AsyncClient)
- `pg_session` — session PostgreSQL de test
- `mysql_session` — session MySQL de test

### 15.2 Scripts de Vérification

#### verify-all.sh
Vérification complète du système :
1. Statut des 10 conteneurs
2. Connectivité inter-conteneurs
3. Santé des 3 bases de données
4. Existence des foreign tables
5. Existence des vues fédérées
6. Appels API de test (health, dashboard, clients)

#### reconcile.sh
Réconciliation des données :
1. Cohérence des ICF entre PostgreSQL et MySQL
2. Vérification des comptes/crédits
3. Détection des doublons

### 15.3 Pages de Test

- **Swagger UI** : `http://localhost:8000/docs` — test interactif de tous les endpoints
- **Page Fédération** : `http://localhost:3000/federation` — statut FDW en temps réel
- **Page Base de Données** : `http://localhost:3000/database` — informations des 3 bases
- **Grafana** : `http://localhost:3001` — métriques de monitoring

---

## 16. Annexes

### 16.1 Structure Complète du Projet

```
projet_fin_dba/
├── docker-compose.yml              # 10 services
├── .env                            # Variables d'environnement
├── AGENTS.md                       # Documentation projet
├── RAPPORT_ERREURS.md              # Journal des 15 erreurs
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── pytest.ini
│   ├── requirements.txt
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── exceptions.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── agence.py
│   │   │   ├── client.py
│   │   │   ├── compte.py
│   │   │   └── employe.py
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── clients.py
│   │   │   ├── comptes.py
│   │   │   ├── credits.py
│   │   │   ├── operations.py
│   │   │   ├── employes.py
│   │   │   ├── dashboard.py
│   │   │   ├── alertes.py
│   │   │   ├── reconciliation.py
│   │   │   ├── database.py
│   │   │   └── federation.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── client.py
│   │   │   ├── compte.py
│   │   │   ├── credit.py
│   │   │   ├── employe.py
│   │   │   ├── operation.py
│   │   │   ├── alerte.py
│   │   │   ├── dashboard.py
│   │   │   └── database.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── client_service.py
│   │   │   ├── compte_service.py
│   │   │   ├── credit_service.py
│   │   │   ├── employe_service.py
│   │   │   ├── alerte_service.py
│   │   │   ├── reconciliation_service.py
│   │   │   └── database_service.py
│   │   └── utils/
│   │       └── icf_generator.py
│   └── tests/
│       ├── __init__.py
│       ├── conftest.py
│       ├── test_clients.py
│       ├── test_comptes.py
│       ├── test_credits.py
│       ├── test_health.py
│       └── test_federation.py
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── api/
│       │   └── index.js
│       ├── components/
│       │   ├── Badge.jsx
│       │   ├── ErrorMessage.jsx
│       │   ├── FormatCurrency.jsx
│       │   ├── LoadingSpinner.jsx
│       │   └── StatCard.jsx
│       ├── pages/
│       │   ├── DashboardPage.jsx
│       │   ├── ClientsPage.jsx
│       │   ├── ClientDetailPage.jsx
│       │   ├── ClientFormPage.jsx
│       │   ├── ComptesPage.jsx
│       │   ├── CreditsPage.jsx
│       │   ├── CreditDetailPage.jsx
│       │   ├── CreditFormPage.jsx
│       │   ├── EcheanciersPage.jsx
│       │   ├── OperationsPage.jsx
│       │   ├── TransactionFormPage.jsx
│       │   ├── EmployesPage.jsx
│       │   ├── AlertesPage.jsx
│       │   ├── ReconciliationPage.jsx
│       │   ├── FederationPage.jsx
│       │   ├── DatabasePage.jsx
│       │   └── MonitoringPage.jsx
│       └── utils/
│           └── export.js
│
├── postgres-hub/
│   ├── Dockerfile
│   ├── docker-entrypoint-wrapper.sh
│   ├── init/
│   │   ├── 01_create_extensions.sql
│   │   ├── 02_create_tables.sql
│   │   └── 03_create_indexes.sql
│   ├── fdw-init/
│   │   ├── 04_create_fdw_servers.sql
│   │   ├── 05_create_foreign_tables.sql
│   │   └── 06_create_federated_views.sql
│   ├── seed/
│   │   └── seed_postgres.sql
│   └── post-init/
│       └── post-init.sh
│
├── mysql-credit/
│   ├── Dockerfile
│   ├── my.cnf
│   └── init/
│       ├── 01_create_tables.sql
│       ├── 02_create_user.sql
│       └── 03_seed_mysql.sql
│
├── mssql-compta/
│   ├── Dockerfile
│   ├── entrypoint.sh
│   ├── init/
│   │   ├── 01_create_tables.sql
│   │   └── 02_create_user.sql
│   └── seed/
│       └── seed_mssql.sql
│
├── prometheus/
│   └── prometheus.yml
│
├── grafana/
│   ├── provisioning/
│   │   ├── datasources/
│   │   │   └── datasource.yml
│   │   └── dashboards/
│   │       └── dashboards.yml
│   └── dashboards/
│       └── api-dashboard.json
│
├── presentation/
│   ├── presentation.md        # Slides markdown
│   └── site/
│       └── index.html         # Site web interactif
│
└── scripts/
    ├── verify-all.sh
    ├── reconcile.sh
    └── wait-for-it.sh
```

### 16.2 Variables d'Environnement (fichier .env)

| Variable | Valeur par défaut | Description |
|----------|-------------------|-------------|
| `POSTGRES_HOST` | `postgres-hub` | Hôte PostgreSQL |
| `POSTGRES_PORT` | `5432` | Port interne PostgreSQL |
| `POSTGRES_DB` | `banque_federated` | Nom de la base hub |
| `POSTGRES_USER` | `admin` | Utilisateur PostgreSQL |
| `POSTGRES_PASSWORD` | `postgres123` | Mot de passe PostgreSQL |
| `MYSQL_HOST` | `mysql-credit` | Hôte MySQL |
| `MYSQL_PORT` | `3306` | Port interne MySQL |
| `MYSQL_DB` | `banque_credit` | Nom de la base crédits |
| `MYSQL_USER` | `admin` | Utilisateur MySQL |
| `MYSQL_PASSWORD` | `mysql123` | Mot de passe MySQL |
| `MSSQL_HOST` | `mssql-compta` | Hôte SQL Server |
| `MSSQL_PORT` | `1433` | Port interne SQL Server |
| `MSSQL_DB` | `banque_compta` | Nom de la base compta |
| `MSSQL_USER` | `sa` | Utilisateur SQL Server |
| `MSSQL_SA_PASSWORD` | `MSSQL2025!Pass` | Mot de passe SA |
| `VITE_API_URL` | `http://localhost:8000/api` | URL de base API frontend |

### 16.3 Schéma Relationnel Simplifié

```
┌──────────────────────────────────────────────────────────────────┐
│                      PostgreSQL Hub (banque_federated)           │
│                                                                  │
│  agence ──── employe ────┐                                      │
│       (1:N)              │                                       │
│                          ▼                                       │
│                    client ──── compte ──── transaction           │
│                    (ICC)    (1:N)         (1:N)                  │
│                                                                  │
│  ┌────────────────── FDW Foreign Tables ──────────────────┐      │
│  │ fdw_dossier_credit  ◄── MySQL credit.banque_credit    │      │
│  │ fdw_garantie        ◄── MySQL credit.banque_credit    │      │
│  │ fdw_echeancier      ◄── MySQL credit.banque_credit    │      │
│  │ fdw_scoring         ◄── MySQL credit.banque_credit    │      │
│  │                     ─── MySQL credit.banque_credit    │      │
│  │ fdw_ecriture_compta ◄── MSSQL banque_compta           │      │
│  │ fdw_plan_comptable  ◄── MSSQL banque_compta           │      │
│  │ fdw_bulletin_paie   ◄── MSSQL banque_compta           │      │
│  │ fdw_operation_agence◄── MSSQL banque_compta           │      │
│  └───────────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────────┘

┌────────────────────────┐       ┌────────────────────────┐
│   MySQL (banque_credit)│       │  SQL Server (banque_compta)│
│                        │       │                          │
│  dossier_credit (15)   │       │  plan_comptable (60)     │
│       │                │       │  ecriture_comptable (120)│
│       ├── garantie (20)│       │  bulletin_paie (20)      │
│       ├── echeancier(50)       │  operation_agence (50)   │
│       └── scoring (20) │       │                          │
└────────────────────────┘       └──────────────────────────┘
```

### 16.4 Références

- Documentation technique : `AGENTS.md`
- Journal des erreurs : `RAPPORT_ERREURS.md`
- Slides de présentation : `presentation/presentation.md`
- Site interactif : `presentation/site/index.html`
- API Swagger : `http://localhost:8000/docs`
- Grafana : `http://localhost:3001`
- Prometheus : `http://localhost:9090`

---

*Document généré le mai 2026 — Projet Système de Bases de Données Fédérées pour une Banque Commerciale au Togo*
