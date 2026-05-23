# PROMPT 06 - Tests, Donnees de Test et Scripts de Verification

## OBJECTIF

Creer les donnees de test realistes, les tests unitaires et d'integration, les scripts de verification et le README du projet.

## PRE-REQUIS

Tous les prompts precedents (01 a 05) ont ete executes. L'ensemble du systeme est fonctionnel.

---

## PARTIE A : Donnees de Test Realistes

### Script Python de generation des donnees de seed

Creer un script Python `scripts/generate_seed_data.py` qui genere automatiquement des donnees realistes et coherentes pour les trois bases. Ce script doit :

1. **Generer les ICF** en premier lieu, en utilisant la fonction SHA-256
2. **Inserer les agences** avec des villes reelles du Togo :
   - Agence Principale Lome (code: BK001)
   - Agence Kpalime (code: BK002)
   - Agence Sokode (code: BK003)
   - Agence Kara (code: BK004)
   - Agence Dapaong (code: BK005)

3. **Inserer les employes** avec des noms togolais realistes :
   - Au moins 2 employes par agence (10 total)
   - Postes : Directeur d'Agence, Chef de Guichet, Agent de Credit, Caissier, Analyste Risque

4. **Inserer les clients** (20 minimum) :
   - Noms togolais authentiques (mix Ewe, Kabye, Mina, etc.)
   - Numeros de piece d'identite au format togolais (CNI ou passeport)
   - Repartis equitablement entre les agences
   - L'ICF est genere par SHA-256(numero_piece + code_banque)

5. **Inserer les comptes** (30+ minimum) :
   - Repartition : 50% courant, 35% epargne, 15% terme
   - Soldes realistes : courant (50 000 - 5 000 000 XOF), epargne (100 000 - 20 000 000 XOF), terme (500 000 - 50 000 000 XOF)
   - IBAN au format TG00BK00XXXXXXXXXXXX

6. **Inserer les transactions** (100+ minimum) :
   - Repartition : 35% depot, 30% retrait, 25% virement, 10% prelevement
   - Montants realistes : 5 000 - 10 000 000 XOF
   - Dates sur les 6 derniers mois

7. **Inserer les dossiers de credit** (15+ minimum) :
   - Repartition des statuts : 30% en_cours, 35% approuve, 20% rejete, 15% cloture
   - Montants demandes : 500 000 - 15 000 000 XOF
   - Durees : 12, 24, 36, 48, 60 mois
   - Taux : 6% - 15%

8. **Inserer les garanties** (20+ minimum) :
   - Types : nantissement (40%), caution (30%), hypotheque (20%), depot_gage (10%)
   - Valeurs : 60% - 150% du montant du credit

9. **Inserer les echeanciers** (50+ minimum) :
   - 3-6 echeances par dossier
   - Statuts : pending (60%), paid (30%), overdue (10%)

10. **Inserer les scorings** (20+ minimum) :
    - Scores repartis sur l'echelle 0-100
    - Niveaux de risque coherents avec les scores

11. **Inserer le plan comptable OHADA** (50+ comptes minimum) :
    - Classes 1-7 avec les comptes principaux
    - Libelles en francais conformes au SYSCOA

12. **Inserer les ecritures comptables** (100+ minimum) :
    - Ecritures coherentes avec les transactions
    - Debit/credit equilibres
    - Journaux : OD (Operations Diverses), BQ (Banque), VT (Virements), CA (Caisse)

13. **Inserer les bulletins de paie** (20+ minimum) :
    - Salaires bruts : 80 000 - 800 000 XOF (realiste pour le Togo)
    - Salaires nets : 70% - 85% du brut

14. **Inserer les operations d'agence** (50+ minimum) :
    - Types : ouverture_compte, fermeture_compte, virement_interne, retrait_gros, depot_gros
    - Montants coherents

Le script doit ecrire les fichiers SQL de seed dans les repertoires appropries de chaque base de donnees.

---

## PARTIE B : Tests du Backend

### Fichier : `backend/tests/conftest.py`

Configuration pytest avec fixtures :
- `async_client` : client HTTP asynchrone pour tester les endpoints
- `pg_session` : session PostgreSQL de test
- `mysql_session` : session MySQL de test
- Base de donnees de test separee (suffix `_test`)

### Fichier : `backend/tests/test_clients.py`

Tests pour les endpoints clients :
- `test_list_clients` : GET /api/clients retourne 200 et une liste paginee
- `test_list_clients_with_search` : GET /api/clients?search=Kossi retourne les clients correspondants
- `test_list_clients_with_risk_filter` : GET /api/clients?niveau_risque=eleve
- `test_get_client_by_icf` : GET /api/clients/{icf} retourne le client complet
- `test_get_client_not_found` : GET /api/clients/{icf_inexistant} retourne 404
- `test_create_client` : POST /api/clients cree un client et retourne son ICF
- `test_create_client_duplicate_piece` : POST /api/clients avec piece deja existante retourne 409

### Fichier : `backend/tests/test_credits.py`

Tests pour les endpoints credits :
- `test_list_credits` : GET /api/credits retourne 200
- `test_list_credits_by_statut` : GET /api/credits?statut=approuve
- `test_get_credit_by_id` : GET /api/credits/{id} retourne le detail
- `test_create_credit` : POST /api/credits cree un dossier
- `test_create_credit_with_scoring` : POST /api/credits/{id}/scoring ajoute un score

### Fichier : `backend/tests/test_federation.py`

Tests pour la federation :
- `test_federation_status` : GET /api/federation/status retourne l'etat des 3 bases
- `test_health_check` : GET /api/health verifie la connectivite
- `test_vue_client_complet` : la vue federee retourne des donnees combinees
- `test_vue_credit_detail` : la vue federee retourne des credits avec garanties
- `test_vue_tableau_bord` : la vue federee retourne des indicateurs par agence
- `test_predicate_pushdown` : verifier que le filtrage distant fonctionne
- `test_foreign_tables_accessible` : toutes les foreign tables retournent des donnees

### Fichier : `backend/tests/test_reconciliation.py`

Tests pour la reconciliation :
- `test_icf_coherence` : un client avec ICF existe dans les 3 bases
- `test_detect_incoherence` : detection d'une incoherence entre bases
- `test_reconcilier_client` : reconciliation automatique

---

## PARTIE C : Scripts de Verification

### Fichier : `scripts/verify-all.sh`

Script shell qui execute toutes les verifications dans l'ordre :

```bash
#!/bin/bash
# Script de verification complete du systeme federe

echo "=== 1. Verification des conteneurs Docker ==="
docker-compose ps
# Verifier que les 5 conteneurs sont "Up"

echo "=== 2. Verification de PostgreSQL ==="
docker exec postgres-hub pg_isready -U banque_admin -d banque_hub

echo "=== 3. Verification des extensions FDW ==="
docker exec postgres-hub psql -U banque_admin -d banque_hub -c "SELECT extname, extversion FROM pg_extension WHERE extname IN ('mysql_fdw', 'tds_fdw');"

echo "=== 4. Verification des foreign tables ==="
docker exec postgres-hub psql -U banque_admin -d banque_hub -c "SELECT COUNT(*) FROM fdw_dossier_credit;"
docker exec postgres-hub psql -U banque_admin -d banque_hub -c "SELECT COUNT(*) FROM fdw_ecriture_comptable;"

echo "=== 5. Verification des vues federees ==="
docker exec postgres-hub psql -U banque_admin -d banque_hub -c "SELECT COUNT(*) FROM vue_client_complet;"
docker exec postgres-hub psql -U banque_admin -d banque_hub -c "SELECT COUNT(*) FROM vue_credit_detail;"
docker exec postgres-hub psql -U banque_admin -d banque_hub -c "SELECT COUNT(*) FROM vue_operation_comptable;"
docker exec postgres-hub psql -U banque_admin -d banque_hub -c "SELECT COUNT(*) FROM vue_tableau_bord;"

echo "=== 6. Verification de MySQL ==="
docker exec mysql-credit mysqladmin ping -h localhost -u credit_user -pCr3ditT0g0!

echo "=== 7. Verification de SQL Server ==="
docker exec mssql-compta /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "C0mptaT0g0!2025" -C -Q "SELECT name FROM sys.databases"

echo "=== 8. Verification du backend FastAPI ==="
curl -s http://localhost:8000/api/health | python3 -m json.tool

echo "=== 9. Verification des endpoints API ==="
curl -s http://localhost:8000/api/clients?page_size=5 | python3 -m json.tool
curl -s http://localhost:8000/api/credits?page_size=5 | python3 -m json.tool
curl -s http://localhost:8000/api/dashboard | python3 -m json.tool

echo "=== 10. Verification du frontend ==="
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000

echo "=== Verification terminee ==="
```

### Fichier : `scripts/reconcile.sh`

Script de reconciliation qui :
1. Extrait tous les ICF de PostgreSQL
2. Pour chaque ICF, verifie sa presence dans MySQL et SQL Server
3. Genere un rapport d'incoherence
4. Propose des corrections

---

## PARTIE D : README du Projet

### Fichier : `README.md`

Le README doit contenir :

1. **Titre et description** du projet
2. **Architecture** avec un diagramme ASCII
3. **Pre-requis** : Docker, Docker Compose, Git
4. **Installation rapide** :
   ```bash
   git clone <repo>
   cd banque-togo-federees
   cp .env.example .env
   docker-compose up --build
   ```
5. **Acces aux services** :
   - PostgreSQL : localhost:5432
   - MySQL : localhost:3306
   - SQL Server : localhost:1433
   - API FastAPI : http://localhost:8000 (Swagger : /docs)
   - Interface web : http://localhost:3000
6. **Structure du projet** (arborescence)
7. **Vues federees** : description des 4 vues
8. **API Reference** : lien vers Swagger
9. **Tests** : comment executer les tests
10. **Reconciliation** : comment verifier la coherence des donnees
11. **Technologies utilisees** : tableau recapitulatif
12. **Auteurs** : Universite de Lome - EPL - Departement d'Informatique

---

## PARTIE E : Dockerfile du Backend

### Fichier : `backend/Dockerfile`

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Installer les dependances systeme
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copier et installer les dependances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code source
COPY . .

# Exposer le port
EXPOSE 8000

# Commande de demarrage
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## PARTIE F : Dockerfile du Frontend

### Fichier : `frontend/Dockerfile`

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copier les fichiers de dependances
COPY package.json package-lock.json* ./

# Installer les dependances
RUN npm install

# Copier le code source
COPY . .

# Exposer le port
EXPOSE 3000

# Commande de demarrage (mode developpement)
CMD ["npm", "run", "dev", "--", "--host"]
```

## LIVRABLES ATTENDUS

- [ ] `scripts/generate_seed_data.py`
- [ ] `backend/tests/conftest.py`
- [ ] `backend/tests/test_clients.py`
- [ ] `backend/tests/test_credits.py`
- [ ] `backend/tests/test_federation.py`
- [ ] `backend/tests/test_reconciliation.py`
- [ ] `scripts/verify-all.sh`
- [ ] `scripts/reconcile.sh`
- [ ] `README.md`
- [ ] `backend/Dockerfile`
- [ ] `frontend/Dockerfile`
- [ ] Verification : `pytest` execute tous les tests avec succes
- [ ] Verification : `./scripts/verify-all.sh` passe toutes les etapes

## NOTES IMPORTANTES

- Les donnees de test doivent etre **deterministes** (seed fixe pour la reproductibilite).
- Les tests d'integration doivent etre marques avec `@pytest.mark.integration` et pouvoir etre exclus avec `pytest -m "not integration"`.
- Le script de generation de seed doit pouvoir etre execute independamment pour regenerer les donnees.
- Les montants doivent etre formates en FCFA (XOF) partout dans les tests et les donnees.
- Le rapport de reconciliation doit identifier clairement les incoherences (client sans credit, credit sans client, ICF absent d'une base).
- Le README doit etre suffisant pour qu'un nouveau developpeur puisse demarrer le projet en moins de 15 minutes.
