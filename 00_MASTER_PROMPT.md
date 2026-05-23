# MASTER PROMPT - Systeme de Bases de Donnees Federees pour l'Optimisation des Performances d'une Banque Commerciale au Togo

## ROLE DE L'AGENT

Tu es un ingenieur full-stack senior specialise dans :
- Les architectures de bases de donnees distribuees et federees
- PostgreSQL avance (FDW, SQL/MED, vues materialisees)
- Docker et l'orchestration de conteneurs
- FastAPI (Python) avec SQLAlchemy asynchrone
- Les interfaces web modernes (React.js ou Vue.js)
- Les normes comptables OHADA et bancaires BCEAO/UEMOA

## CONTEXTE DU PROJET

Le secteur bancaire togolais fait face a un defi structurel majeur : la **fragmentation de ses systemes d'information**. Les banques commerciales du Togo operent avec plusieurs SGBD heterogenes, chacun dedie a un domaine fonctionnel specifique (clientele, credits, comptabilite, RH). Cette dispersion engendre des redondances, des incoherences et une impossibilite d'obtenir une vue unifiee en temps reel.

Ce projet vise a concevoir et mettre en oeuvre un **systeme de bases de donnees federees** qui offre une interface d'acces unifiee a des sources de donnees heterogenes, tout en preservant l'autonomie de chaque base constitutive.

## ARCHITECTURE GLOBALE

```
                    +---------------------------+
                    |    INTERFACE WEB (React)   |
                    |        Port 3000           |
                    +-------------|-------------+
                                  |
                    +-------------|-------------+
                    |    BACKEND FastAPI         |
                    |    Python 3.12 - Port 8000 |
                    +-------------|-------------+
                                  |
                    +-------------|-------------+
                    |  PostgreSQL 16 (HUB)       |
                    |  Hub central - Port 5432   |
                    |  + mysql_fdw + tds_fdw     |
                    +------|-----------|---------+
                           |           |
              +------------|--+     +--|------------+
              |  MySQL 8.0    |     |  SQL Server   |
              |  Port 3306    |     |  2022 Port    |
              |  Credits &    |     |  1433         |
              |  Risque       |     |  Compta & RH  |
              +---------------+     +---------------+
```

### Topologie des bases de donnees

| Base de donnees | Role | Domaine fonctionnel | FDW utilise |
|---|---|---|---|
| PostgreSQL | Hub central (maitre) | Clientele, Comptes, Transactions | Natif |
| MySQL | Base esclave | Credits, Risque, Scoring | mysql_fdw |
| SQL Server | Base esclave | Comptabilite, RH, Agences | tds_fdw |

### Mecanisme cle : Identifiant Client Federe (ICF)

L'ICF est genere par : `SHA-256(numero_piece_identite + code_banque)`. Il est present dans les trois bases et permet de reconcilier les donnees d'un meme client a travers les systemes heterogenes. Il garantit unicite et securite (impossible de retrouver le numero de piece a partir de l'ICF).

## STRUCTURE DU DEPOT

```
banque-togo-federees/
├── docker-compose.yml
├── .env
├── README.md
│
├── postgres-hub/
│   ├── Dockerfile
│   ├── init/
│   │   ├── 01_create_extensions.sql
│   │   ├── 02_create_local_tables.sql
│   │   ├── 03_create_indexes.sql
│   │   ├── 04_create_fdw_servers.sql
│   │   ├── 05_create_foreign_tables.sql
│   │   ├── 06_create_mapping_tables.sql
│   │   ├── 07_create_federated_views.sql
│   │   └── 08_create_materialized_views.sql
│   └── seed/
│       └── seed_postgres.sql
│
├── mysql-credit/
│   ├── Dockerfile
│   ├── init/
│   │   ├── 01_create_tables.sql
│   │   ├── 02_create_indexes.sql
│   │   └── 03_create_user.sql
│   └── seed/
│       └── seed_mysql.sql
│
├── mssql-compta/
│   ├── Dockerfile
│   ├── init/
│   │   ├── 01_create_tables.sql
│   │   ├── 02_create_indexes.sql
│   │   └── 03_create_user.sql
│   └── seed/
│       └── seed_mssql.sql
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── postgres_models.py
│   │   │   ├── mysql_models.py
│   │   │   └── mssql_models.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── client.py
│   │   │   ├── credit.py
│   │   │   ├── operation.py
│   │   │   └── dashboard.py
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── clients.py
│   │   │   ├── credits.py
│   │   │   ├── operations.py
│   │   │   └── dashboard.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── federation_service.py
│   │   │   └── reconciliation_service.py
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── icf_generator.py
│   └── tests/
│       ├── __init__.py
│       ├── test_clients.py
│       ├── test_credits.py
│       ├── test_federation.py
│       └── test_reconciliation.py
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── api/
│   │   │   └── index.js
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── ClientList.jsx
│   │   │   ├── ClientDetail.jsx
│   │   │   ├── CreditList.jsx
│   │   │   ├── CreditDetail.jsx
│   │   │   ├── OperationList.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── FederationStatus.jsx
│   │   └── pages/
│   │       ├── HomePage.jsx
│   │       ├── ClientsPage.jsx
│   │       ├── CreditsPage.jsx
│   │       ├── OperationsPage.jsx
│   │       └── DashboardPage.jsx
│   └── public/
│       └── index.html
│
└── scripts/
    ├── wait-for-it.sh
    ├── init-federation.sh
    └── reconcile.sh
```

## FICHIERS DE PROMPT A EXECUTER DANS L'ORDRE

Les prompts sont divises en fichiers markdown a executer **sequentiellement**. Chaque prompt est independant mais presuppose que les prompts precedents ont ete executes.

| Ordre | Fichier | Contenu |
|---|---|---|
| 1 | `01_ARCHITECTURE_DOCKER.md` | Docker Compose, Dockerfiles, reseau, variables d'environnement |
| 2 | `02_MODELISATION_BDD.md` | Schemas SQL des 3 bases (conceptuel, logique, physique), index, contraintes |
| 3 | `03_FDW_VUES_FEDEREES.md` | Extensions FDW, foreign tables, mapping, vues federees, vues materialisees |
| 4 | `04_BACKEND_FASTAPI.md` | API FastAPI, SQLAlchemy, modeles, schemas, routers, services |
| 5 | `05_FRONTEND_WEB.md` | Interface React.js, composants, pages, appels API |
| 6 | `06_TESTS_SEED_DATA.md` | Donnees de test, scripts de seed, tests unitaires et d'integration |

## REGLES GLOBALES DE DEVELOPPEMENT

1. **Langue** : Tous les commentaires dans le code, les noms de variables, les messages d'erreur et la documentation doivent etre en **FRANCAIS** (sauf les mots-cles techniques standard comme `SELECT`, `CREATE TABLE`, etc.).
2. **Devise** : La devise est le **FCFA (XOF)**. Tous les montants utilisent `NUMERIC(15,2)` / `DECIMAL(18,2)`.
3. **Normes comptables** : Conformite au **plan comptable OHADA** (classes 1 a 9).
4. **Reglementation** : Respect des normes **BCEAO/UEMOA** pour la tracabilite bancaire.
5. **Securite** : L'ICF utilise SHA-256. Aucune donnee personnelle ne doit etre exposee en clair dans les API ou les logs.
6. **Asynchrone** : Le backend FastAPI doit utiliser `async/await` avec `asyncpg` pour PostgreSQL et `aiomysql` pour MySQL.
7. **Validation** : Toutes les entrees API doivent etre validees avec Pydantic.
8. **Documentation** : Chaque endpoint FastAPI doit avoir un `description`, des `response_model`, et des exemples.
9. **Gestion d'erreurs** : Utiliser des exceptions HTTP personnalisées avec codes d'erreur coherents.
10. **Logs** : Utiliser le module `logging` de Python avec des niveaux appropriés (INFO pour les acces, WARNING pour les reconciliations, ERROR pour les echecs).

## VERIFICATION DE FIN DE PROJET

A la fin de l'implementation, l'agent doit verifier que :

- [ ] `docker-compose up --build` demarre les 5 conteneurs sans erreur
- [ ] PostgreSQL est accessible sur le port 5432 avec les extensions mysql_fdw et tds_fdw installees
- [ ] MySQL est accessible sur le port 3306 avec les tables de credits et scoring
- [ ] SQL Server est accessible sur le port 1433 avec les tables comptables et RH
- [ ] Les foreign tables sont accessibles depuis PostgreSQL
- [ ] Les 4 vues federees retournent des donnees coherentes
- [ ] L'API FastAPI sur le port 8000 repond avec la documentation Swagger accessible
- [ ] Les 5 endpoints REST fonctionnent correctement
- [ ] L'interface web sur le port 3000 affiche les donnees federees
- [ ] Les donnees de test permettent de demontrer les cas d'usage metier
- [ ] Le mecanisme ICF permet de reconcilier un client a travers les 3 bases
