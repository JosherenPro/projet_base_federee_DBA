# PROMPT 01 - Architecture Docker & Infrastructure

## OBJECTIF

Creer l'infrastructure Docker complete pour le systeme de bases de donnees federees. Cela inclut le fichier `docker-compose.yml`, les Dockerfiles personnalises, les variables d'environnement, les reseaux et les volumes.

## SPECIFICATIONS DETAILLEES

### 1. Fichier `.env` (a la racine du projet)

```env
# === PostgreSQL - Hub Central ===
POSTGRES_HOST=postgres-hub
POSTGRES_PORT=5432
POSTGRES_DB=banque_hub
POSTGRES_USER=banque_admin
POSTGRES_PASSWORD=T0g0B4nque2025!

# === MySQL - Credits & Risque ===
MYSQL_HOST=mysql-credit
MYSQL_PORT=3306
MYSQL_DB=banque_credit
MYSQL_USER=credit_user
MYSQL_PASSWORD=Cr3ditT0g0!
MYSQL_ROOT_PASSWORD=R00tT0g0!

# === SQL Server - Comptabilite & RH ===
MSSQL_HOST=mssql-compta
MSSQL_PORT=1433
MSSQL_DB=banque_compta
MSSQL_USER=sa
MSSQL_PASSWORD=C0mptaT0g0!2025
MSSQL_SA_PASSWORD=C0mptaT0g0!2025

# === Backend FastAPI ===
FASTAPI_HOST=fastapi-backend
FASTAPI_PORT=8000
DATABASE_URL_POSTGRES=postgresql+asyncpg://banque_admin:T0g0B4nque2025!@postgres-hub:5432/banque_hub
DATABASE_URL_MYSQL=mysql+aiomysql://credit_user:Cr3ditT0g0!@mysql-credit:3306/banque_credit

# === Frontend ===
FRONTEND_HOST=react-frontend
FRONTEND_PORT=3000
VITE_API_URL=http://localhost:8000

# === Federation ===
FDW_MYSQL_HOST=mysql-credit
FDW_MYSQL_PORT=3306
FDW_MYSQL_DB=banque_credit
FDW_MYSQL_USER=fdw_user
FDW_MYSQL_PASSWORD=FdwT0g0!2025

FDW_MSSQL_HOST=mssql-compta
FDW_MSSQL_PORT=1433
FDW_MSSQL_DB=banque_compta
FDW_MSSQL_USER=fdw_user
FDW_MSSQL_PASSWORD=FdwMssqlT0g0!
```

### 2. Fichier `docker-compose.yml` (a la racine du projet)

**Contraintes critiques :**
- 5 services : `postgres-hub`, `mysql-credit`, `mssql-compta`, `fastapi-backend`, `react-frontend`
- Reseau Docker dedie : `reseau-banque` (driver bridge)
- Volumes nommes pour la persistance : `pg_data`, `mysql_data`, `mssql_data`
- Ordre de demarrage : bases de donnees d'abord, puis backend, puis frontend
- Healthchecks obligatoires pour chaque service
- Les conteneurs doivent redemarrer automatiquement (`restart: unless-stopped`)

**Service postgres-hub :**
- Image de base : `postgres:16`
- Port expose : 5432
- Le Dockerfile doit installer les extensions `mysql_fdw` et `tds_fdw` depuis les sources
- Les scripts SQL d'initialisation sont montes dans `/docker-entrypoint-initdb.d/`
- Healthcheck : `pg_isready -U banque_admin -d banque_hub`
- Variables d'environnement depuis le fichier `.env`

**Service mysql-credit :**
- Image de base : `mysql:8.0`
- Port expose : 3306
- Charset : `utf8mb4`, collation : `utf8mb4_unicode_ci`
- Les scripts SQL d'initialisation sont montes dans `/docker-entrypoint-initdb.d/`
- Healthcheck : `mysqladmin ping -h localhost`

**Service mssql-compta :**
- Image de base : `mcr.microsoft.com/mssql/server:2022-latest`
- Port expose : 1433
- Accepter les conditions : `ACCEPT_EULA=Y`
- Healthcheck : `/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -Q "SELECT 1"`

**Service fastapi-backend :**
- Image de base : `python:3.12-slim`
- Port expose : 8000
- Dependance : `postgres-hub` (healthy), `mysql-credit` (healthy), `mssql-compta` (healthy)
- Commande : `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
- Volume : montage du dossier `backend/` dans `/app`

**Service react-frontend :**
- Image de base : `node:20-alpine`
- Port expose : 3000
- Dependance : `fastapi-backend` (healthy)
- Commande : `npm run dev -- --host`
- Volume : montage du dossier `frontend/` dans `/app`

### 3. Dockerfile personnalise pour `postgres-hub`

Ce Dockerfile doit :
1. Partir de `postgres:16`
2. Installer les dependances de compilation : `build-essential`, `libmysqlclient-dev`, `freetds-dev`, `postgresql-server-dev-16`, `git`
3. Cloner et compiler `mysql_fdw` depuis `https://github.com/EnterpriseDB/mysql_fdw.git` (branche master ou tag 2.9+)
4. Cloner et compiler `tds_fdw` depuis `https://github.com/tds-fdw/tds_fdw.git` (branche master ou tag 2.0+)
5. Copier les scripts d'initialisation SQL dans `/docker-entrypoint-initdb.d/`

### 4. Dockerfile pour `mysql-credit`

Pas de personnalisation majeure. Utiliser l'image `mysql:8.0` directement dans le docker-compose, mais creer un `Dockerfile` pour :
1. Copier les scripts d'initialisation
2. Configurer le charset `utf8mb4`

### 5. Dockerfile pour `mssql-compta`

Pas de personnalisation majeure. Utiliser l'image de base directement dans le docker-compose.

### 6. Script `scripts/wait-for-it.sh`

Telecharger ou creer un script `wait-for-it.sh` qui attend qu'un hote:port soit disponible avant de continuer. Ce script sera utilise par le backend et le frontend pour attendre que les bases de donnees soient pretes.

### 7. Script `scripts/init-federation.sh`

Script shell qui :
1. Attend que PostgreSQL soit demarre et pret
2. Attend que MySQL soit demarre et pret
3. Attend que SQL Server soit demarre et pret
4. Execute les commandes SQL pour creer les extensions FDW dans PostgreSQL
5. Cree les serveurs distants (CREATE SERVER mysql_server ..., CREATE SERVER mssql_server ...)
6. Cree les user mappings (CREATE USER MAPPING ...)
7. Cree les foreign tables
8. Cree les vues federees
9. Affiche un message de confirmation

## LIVRABLES ATTENDUS

- [ ] `.env` a la racine du projet
- [ ] `docker-compose.yml` a la racine du projet
- [ ] `postgres-hub/Dockerfile`
- [ ] `mysql-credit/Dockerfile`
- [ ] `mssql-compta/Dockerfile`
- [ ] `backend/Dockerfile`
- [ ] `frontend/Dockerfile`
- [ ] `scripts/wait-for-it.sh`
- [ ] `scripts/init-federation.sh`
- [ ] Verification : `docker-compose config` ne retourne aucune erreur

## NOTES IMPORTANTES

- L'installation de `mysql_fdw` et `tds_fdw` dans le conteneur PostgreSQL est l'etape la plus delicate. S'assurer que les dependances de compilation sont correctement installees et que les extensions sont compilees avec les bons chemins PostgreSQL.
- Pour SQL Server, l'image officielle Microsoft utilise `MSSQL_SA_PASSWORD` comme variable d'environnement pour le mot de passe SA.
- Le healthcheck de SQL Server doit utiliser `sqlcmd` avec le flag `-C` pour faire confiance au certificat.
- Les volumes doivent etre nommes (pas de bind mounts) pour la persistance des donnees.
- Le reseau Docker doit etre un bridge dedie pour isoler les communications.
