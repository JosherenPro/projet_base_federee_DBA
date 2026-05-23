# PROMPT 08 - Document de Specification Finale (SPECIFICATION.md)

## OBJECTIF

Ce prompt definit les regles et la structure pour rediger le **document de specification finale** du systeme de bases de donnees federees. Ce document est genere **a la fin du projet** et reflete l'etat reel et complet du systeme tel qu'il a ete implemente — pas tel qu'il a ete concu initialement. Il constitue la reference technique definitive du projet.

## PRINCIPES DIRECTEURS

1. **Verite de terrain** — Le document decrit ce qui a reellement ete implemente, pas ce qui etait prevu. Si une fonctionnalite a ete modifiee, simplifiee ou abandonnee, le document le mentionne explicitement.
2. **Exhaustivite** — Chaque composant du systeme doit etre documente : infrastructure, bases de donnees, federation, API, interface, tests, scripts.
3. **Precision technique** — Les schemas SQL, les endpoints API, les configurations Docker et les structures de fichiers doivent etre copies exactement depuis le code reel, pas reconstruits de memoire.
4. **Coherence avec le code** — Si le document contredit le code, le code a raison. Le document doit etre mis a jour pour correspondre au code.
5. **Langue** — Le document est redige en **FRANCAIS**.
6. **Professionalisme** — Ce document doit pouvoir etre presente a un jury d'examen universitaire et servir de reference technique pour une mise en production reelle.

## STRUCTURE DU DOCUMENT SPECIFICATION.md

Le document doit suivre **exactement** cette structure avec les profondeurs de contenu specifiees :

---

```markdown
# Document de Specification Technique
## Systeme de Bases de Donnees Federees pour l'Optimisation des Performances d'une Banque Commerciale au Togo

---

**Universite** : Universite de Lome
**Ecole** : Ecole Polytechnique de Lome (EPL)
**Departement** : Departement d'Informatique
**Unite d'Enseignement** : DBA
**Annee universitaire** : 2025 - 2026

**Version du document** : 1.0
**Date de generation** : [AAAA-MM-JJ]
**Statut** : FINAL

---

## Historique des Versions

| Version | Date | Auteur | Description |
|---------|------|--------|-------------|
| 1.0 | AAAA-MM-JJ | [Nom] | Version finale du document de specification |

---

## Table des Matieres

1. Introduction et Contexte
2. Architecture du Systeme
3. Infrastructure Docker
4. Modelisation des Bases de Donnees
5. Mecanisme de Federation (FDW)
6. Vues Federees
7. API REST (Backend FastAPI)
8. Interface Web (Frontend React)
9. Securite et Conformite
10. Tests et Validation
11. Guide de Deploiement
12. Guide d'Utilisation
13. Problemes Connus et Limitations
14. Glossaire
15. Annexes

---

# 1. Introduction et Contexte

## 1.1 Problematique

[Minimum 300 mots. Decrire le probleme de fragmentation des systemes d'information bancaires au Togo,
les consequences sur la prise de decision, la conformite reglementaire BCEAO/UEMOA,
et la necessite d'un systeme de federation. Reutiliser et enrichir le contenu du document original.]

## 1.2 Objectifs du projet

[Liste numerotee des objectifs atteints. Chaque objectif doit indiquer s'il a ete
pleinement atteint, partiellement atteint, ou non atteint.]

1. [Objectif 1] — Statut : PLEINEMENT ATTEINT / PARTIELLEMENT ATTEINT / NON ATTEINT
2. [Objectif 2] — Statut : ...
   ...

## 1.3 Perimetre du systeme

[Decrire clairement ce qui est dans le perimetre et ce qui est hors perimetre.

### Dans le perimetre
- Federation de 3 bases de donnees heterogenes (PostgreSQL, MySQL, SQL Server)
- Acces en lecture aux donnees federees via des vues SQL
- API REST pour l'interrogation des vues federees
- Interface web de visualisation
- Conteneurisation Docker
- ...

### Hors perimetre
- Ecriture distribuee (transactions entre bases)
- Replication en temps reel
- Haute disponibilite (clustering, failover)
- Chiffrement des donnees au repos
- Authentification des utilisateurs (SSO, LDAP)
- ...
]

## 1.4 Ecarts par rapport a la conception initiale

[Tableau listant chaque ecart entre le document de conception original (PDF) et l'implementation
finale. Pour chaque ecart, expliquer la raison.]

| Fonctionnalite prevue | Implementation reelle | Raison de l'ecart |
|----------------------|---------------------|-------------------|
| ... | ... | ... |

---

# 2. Architecture du Systeme

## 2.1 Vue d'ensemble

[Diagramme ASCII de l'architecture complete, identique a celui du MASTER_PROMPT mais
mis a jour avec les ports reels, les noms de conteneurs reels, et les connexions effectives.]

```
[Diagramme d'architecture]
```

## 2.2 Principes architecturaux

[Decrire les principes qui ont guide les choix techniques :
- Mediateur central (PostgreSQL comme hub)
- Autonomie des bases esclaves
- Transparence de la federation pour les applications
- Conteneurisation pour la portabilite
- API REST comme unique point d'entree
- Separation des responsabilites (chaque base gere son domaine)
]

## 2.3 Flux de donnees

[Decrire les flux de donnees principaux avec des diagrammes textuels :

1. Flux de lecture d'un client complet (requete API -> PostgreSQL -> Vue federee -> MySQL + local -> Reponse)
2. Flux de creation d'un client (API -> PostgreSQL -> Trigger ICF -> Reponse)
3. Flux de creation d'un dossier de credit (API -> MySQL -> Reponse)
4. Flux du tableau de bord (API -> Vue materialisee -> Agregation -> Reponse)
]

## 2.4 Topologie reelle des bases de donnees

[Tableau identique au document original mais avec les valeurs reelles :

| Base de donnees | Role | Domaine fonctionnel | FDW utilise | Nombre de tables | Nombre de lignes (seed) |
|---|---|---|---|---|---|
| PostgreSQL | ... | ... | ... | [valeur reelle] | [valeur reelle] |
| MySQL | ... | ... | ... | ... | ... |
| SQL Server | ... | ... | ... | ... | ... |
]

---

# 3. Infrastructure Docker

## 3.1 Services et conteneurs

[Tableau de chaque conteneur avec toutes ses specifications reelles :

| Conteneur | Image reelle | Port expose | Volume | Variables d'env. | Healthcheck | Taille image |
|-----------|-------------|-------------|--------|------------------|-------------|-------------|
| postgres-hub | ... | ... | ... | ... | ... | ... |
| mysql-credit | ... | ... | ... | ... | ... | ... |
| mssql-compta | ... | ... | ... | ... | ... | ... |
| fastapi-backend | ... | ... | ... | ... | ... | ... |
| react-frontend | ... | ... | ... | ... | ... | ... |
]

## 3.2 Reseau Docker

[Nom du reseau, driver, sous-reseau si defini, regles de communication inter-conteneurs.]

## 3.3 Volumes

[Tableau des volumes nommes avec leur point de montage et leur utilite :

| Volume | Conteneur | Point de montage | Role |
|--------|-----------|------------------|------|
| pg_data | postgres-hub | /var/lib/postgresql/data | Persistance PostgreSQL |
| ... | ... | ... | ... |
]

## 3.4 Ordre de demarrage

[Decrire l'ordre de demarrage avec les dependances et les healthchecks.
Inclure les temps de demarrage typiques observes.]

## 3.5 Variables d'environnement

[Tableau complet de toutes les variables d'environnement utilisees, groupees par service.
Indiquer les valeurs par defaut et si elles sont obligatoires ou optionnelles.
NE PAS inclure les mots de passe en clair — utiliser des placeholder comme [MOT_DE_PASSE_BD]]
]

---

# 4. Modelisation des Bases de Donnees

## 4.1 PostgreSQL — Hub Central

### 4.1.1 Schema complet

[Coller le schema SQL reel tel qu'il est dans le fichier 02_create_local_tables.sql.
Inclure les types de donnees, les contraintes, les cles primaires et etrangeres.]

```sql
-- Coller le schema SQL reel ici
```

### 4.1.2 Trigger ICF

[Documenter le trigger de generation automatique de l'ICF :
- Nom du trigger
- Fonction associee
- Evenement declencheur (BEFORE INSERT)
- Algorithme : SHA-256(numero_piece + code_banque)
- Code source complet du trigger]

### 4.1.3 Index

[Tableau des index reels avec leur type et justification :

| Table | Nom de l'index | Type | Colonnes | Justification |
|-------|---------------|------|----------|---------------|
| client | idx_client_icf | UNIQUE B-tree | icf | Jointure federee |
| ... | ... | ... | ... | ... |
]

## 4.2 MySQL — Credits et Risque

### 4.2.1 Schema complet

[Coller le schema SQL reel.]

### 4.2.2 Trigger niveau_risque

[Documenter le trigger de determination automatique du niveau de risque :
- Regle : 0-25 -> tres_eleve, 26-50 -> eleve, 51-75 -> moyen, 76-100 -> faible
- Code source complet]

### 4.2.3 Index

[Tableau des index reels.]

## 4.3 SQL Server — Comptabilite et RH

### 4.3.1 Schema complet

[Coller le schema SQL reel.]

### 4.3.2 Conformite OHADA

[Decrire comment le schema respecte le plan comptable OHADA :
- Classes utilisees (1-7 minimum)
- Types DECIMAL(18,2) pour les montants
- Reference au SYSCOA
- Liste des comptes du plan comptable implementes]

### 4.3.3 Index

[Tableau des index reels.]

## 4.4 Correspondance des cles entre bases

[Tableau de correspondance montrant comment les entites sont liees entre les 3 bases :

| Table source (Base) | Cle de jointure | Table cible (Base) | Type de lien |
|---------------------|----------------|-------------------|-------------|
| client.icf (PG) | ICF | dossier_credit.icf (MySQL) | Jointure federee |
| client.icf (PG) | ICF | scoring.icf (MySQL) | Jointure federee |
| agence.id_agence (PG) | id_agence | ecriture_comptable.id_agence (MSSQL) | Reference logique |
| ... | ... | ... | ... |
]

---

# 5. Mecanisme de Federation (FDW)

## 5.1 Principe SQL/MED

[Minimum 200 mots. Expliquer le principe de la norme SQL/MED, comment PostgreSQL l'implemente
via les extensions FDW, et comment les requetes sont traduites et optimisees.]

## 5.2 Extensions installees

[Tableau des extensions FDW avec leur version reelle :

| Extension | Version installee | Source | Role |
|-----------|------------------|--------|------|
| mysql_fdw | [version reelle] | EnterpriseDB/mysql_fdw | Federation MySQL |
| tds_fdw | [version reelle] | tds-fdw/tds_fdw | Federation SQL Server |
]

## 5.3 Serveurs distants

[Coller les instructions CREATE SERVER reelles utilisees, avec les options de connexion.]

## 5.4 User Mappings

[Coller les instructions CREATE USER MAPPING reelles. Masquer les mots de passe avec [MOT_DE_PASSE].]

## 5.5 Foreign Tables

[Tableau complet des foreign tables avec leur definition :

| Foreign Table | Serveur source | Table distante | Colonnes projetees |
|---------------|---------------|----------------|-------------------|
| fdw_dossier_credit | mysql_server | dossier_credit | [liste] |
| fdw_garantie | mysql_server | garantie | [liste] |
| fdw_echeancier | mysql_server | echeancier | [liste] |
| fdw_scoring | mysql_server | scoring | [liste] |
| fdw_ecriture_comptable | mssql_server | ecriture_comptable | [liste] |
| fdw_plan_comptable | mssql_server | plan_comptable | [liste] |
| fdw_bulletin_paie | mssql_server | bulletin_paie | [liste] |
| fdw_operation_agence | mssql_server | operation_agence | [liste] |
]

## 5.6 Predicate Pushdown

[Decrire le mecanisme de predicate pushdown observe :
- Quels predicats sont pousses vers les bases distantes ?
- Quels predicats ne le sont pas ?
- Impact sur les performances
- Inclure un exemple de plan d'execution EXPLAIN reel]

## 5.7 Tables de Mapping Inter-Schemas

[Coller le contenu reel des tables mapping_table, mapping_attribut et source_donnees.]

## 5.8 Strategie de coherence des donnees

[Decrire la strategie reelle implementee :
1. Modele maitre-esclave (PostgreSQL = autorite pour clientele/comptes)
2. Reconciliation periodique via ICF
3. Validation en deux phases (2PC) si implementee, ou mentionner si non implementee
4. Script de reconciliation et son fonctionnement]

---

# 6. Vues Federees

## 6.1 Vue 1 : vue_client_complet

**Objectif** : Profil client unifie avec score de risque, solde total et nombre de comptes.

**Sources** : PostgreSQL (client + compte) + MySQL (scoring)

**Schema de sortie** :

| Colonne | Type | Source | Description |
|---------|------|--------|-------------|
| id_client | INTEGER | PG | Identifiant du client |
| nom | VARCHAR(100) | PG | Nom du client |
| ... | ... | ... | ... |

**Requete SQL complete** :
```sql
-- Coller la requete CREATE VIEW reelle
```

**Exemple de resultat** :
```
[Coller un exemple de sortie reel avec 2-3 lignes]
```

## 6.2 Vue 2 : vue_credit_detail

[Meme structure que 6.1]

## 6.3 Vue 3 : vue_operation_comptable

[Meme structure que 6.1]

## 6.4 Vue 4 : vue_tableau_bord

[Meme structure que 6.1]

## 6.5 Vues Materialisees

[Documenter chaque vue materialisee :
- Nom
- Definition (requete source)
- Index definis
- Frequence de rafraichissement
- Fonction de rafraichissement
- Temps de rafraichissement observe
]

---

# 7. API REST (Backend FastAPI)

## 7.1 Configuration technique

| Parametre | Valeur |
|-----------|--------|
| Framework | FastAPI [version] |
| Python | 3.12 |
| ORM | SQLAlchemy 2.0+ (async) |
| Pilote PG | asyncpg |
| Pilote MySQL | aiomysql |
| Serveur ASGI | Uvicorn |
| Port | 8000 |
| Documentation | http://localhost:8000/docs |

## 7.2 Endpoints

### GET /api/health

**Description** : Verifie la connectivite aux 3 bases de donnees.

**Reponse 200** :
```json
{
    "status": "healthy",
    "postgresql": "connected",
    "mysql": "connected",
    "mssql": "connected",
    "timestamp": "2025-03-15T14:30:00Z"
}
```

### GET /api/federation/status

**Description** : Retourne l'etat de la federation (serveurs FDW, foreign tables, vues).

**Reponse 200** :
```json
{
    "serveurs_fdw": [...],
    "foreign_tables_count": 8,
    "vues_federees_count": 4,
    "etat": "operationnel"
}
```

### GET /api/clients

**Description** : Liste des clients avec profil complet et score de risque.

**Parametres** :

| Parametre | Type | Defaut | Description |
|-----------|------|--------|-------------|
| page | int | 1 | Numero de page |
| page_size | int | 20 | Taille de page (max 100) |
| search | string | null | Recherche par nom/prenom |
| niveau_risque | string | null | Filtre (faible/moyen/eleve/tres_eleve) |
| agence_ville | string | null | Filtre par ville d'agence |

**Reponse 200** :
```json
{
    "total": 20,
    "page": 1,
    "page_size": 20,
    "clients": [
        {
            "id_client": 1,
            "nom": "Mensah",
            "prenom": "Afiavi",
            "icf": "a1b2c3d4...",
            "agence_nom": "Agence Principale Lome",
            "solde_total": 3500000.00,
            "score_risque": 72,
            "niveau_risque": "moyen"
        }
    ]
}
```

### GET /api/clients/{icf}

[Documenter de la meme maniere : description, parametres, reponse 200, erreurs 404/500]

### POST /api/clients

[Documenter : body de la requete (JSON), reponse 201, erreurs 400/409]

### GET /api/credits

[Documenter avec tous les parametres et filtres]

### GET /api/credits/{id_dossier}

[...]

### POST /api/credits

[...]

### GET /api/operations

[...]

### GET /api/dashboard

[...]

### GET /api/dashboard/agence/{id_agence}

[...]

### GET /api/dashboard/risque

[...]

### POST /api/dashboard/refresh

[...]

## 7.3 Modeles de donnees (Schemas Pydantic)

[Pour chaque schema Pydantic, documenter :
- Nom du schema
- Champs avec types et validations
- Valeurs par defaut
- Contraintes (min_length, max_length, ge, le, etc.)
- Exemple JSON
]

## 7.4 Gestion des erreurs

[Tableau des codes d'erreur HTTP retournes par l'API :

| Code | Condition | Message | Example |
|------|-----------|---------|---------|
| 200 | Succes | - | ... |
| 201 | Creation reussie | - | ... |
| 400 | Requete invalide | "Parametres de validation incorrects" | ... |
| 404 | Ressource non trouvee | "Client avec ICF xxx non trouve" | ... |
| 409 | Conflit (doublon) | "Un client avec ce numero de piece existe deja" | ... |
| 500 | Erreur interne | "Erreur interne du serveur" | ... |
| 502 | Erreur de federation | "Base distante inaccessible" | ... |
]

---

# 8. Interface Web (Frontend React)

## 8.1 Stack technique

| Technologie | Version | Role |
|-------------|---------|------|
| React | 18+ | Framework UI |
| Vite | 5+ | Bundler / Dev server |
| React Router | 6+ | Navigation SPA |
| Tailwind CSS | 4+ | Stylisme utilitaire |
| Recharts | 2+ | Graphiques |
| Axios | 1+ | Appels HTTP |

## 8.2 Pages et routes

| Route | Page | Description |
|-------|------|-------------|
| / | DashboardPage | Tableau de bord avec indicateurs |
| /clients | ClientsPage | Liste et recherche des clients |
| /clients/:icf | ClientDetail | Fiche detaillee d'un client |
| /credits | CreditsPage | Liste des dossiers de credit |
| /credits/:id | CreditDetail | Detail d'un dossier de credit |
| /operations | OperationsPage | Liste des operations comptables |
| /federation | FederationPage | Etat de la federation |

## 8.3 Composants principaux

[Pour chaque composant principal, documenter :
- Nom du composant
- Props acceptees
- Comportement
- Interactions API
- Capture d'ecran ou description visuelle
]

## 8.4 Palette de couleurs

| Role | Couleur | Hex | Utilisation |
|------|---------|-----|-------------|
| Primaire | Bleu marine | #1e3a5f | Sidebar, titres |
| Secondaire | Or | #c8a951 | Accents, badges importants |
| Accent | Vert | #059669 | Succes, indicateurs positifs |
| Danger | Rouge | #dc2626 | Risque eleve, erreurs |
| Fond | Gris clair | #f8fafc | Arriere-plan |

---

# 9. Securite et Conformite

## 9.1 Protection des donnees personnelles

[Decrire les mesures de protection implementees :
- Hachage SHA-256 pour l'ICF (irreversible)
- Aucune donnee personnelle en clair dans les API ou logs
- Variables d'environnement pour les credentials
- Separation des utilisateurs FDW (lecture seule) et administrateurs
]

## 9.2 Conformite BCEAO/UEMOA

[Decrire comment le systeme respecte les exigences reglementaires :
- Tracabilite des operations (horodatage dans transactions et ecritures)
- Transparence des rapports financiers (vues federees)
- Auditabilite (journal des ecritures comptables)
- Plan comptable OHADA/SYSCOA conforme
]

## 9.3 Securite de l'infrastructure

[Decrire :
- Isolement reseau Docker (bridge dedie)
- Utilisateurs FDW a privileges limites (SELECT seulement)
- Credentials non exposes dans le code source
- CORS configure pour le frontend uniquement
]

## 9.4 Limites de securite

[Lister honnetement les limites de securite du systeme :
- Pas d'authentification utilisateur
- Pas de chiffrement des communications inter-conteneurs
- Pas de chiffrement des donnees au repos
- Mots de passe en clair dans les variables d'environnement Docker
- Pas de gestion des sessions
- Pas de protection CSRF
]

---

# 10. Tests et Validation

## 10.1 Strategie de test

[Decrire la strategie de test :
- Tests unitaires (pytest, backend)
- Tests d'integration (federation, vues federees)
- Tests manuels (interface web)
- Script de verification automatise (verify-all.sh)
]

## 10.2 Couverture des tests

[Tableau des tests implementes :

| Fichier | Nombre de tests | Couverture |
|---------|----------------|------------|
| test_clients.py | X | Endpoints clients |
| test_credits.py | X | Endpoints credits |
| test_federation.py | X | Federation et vues |
| test_reconciliation.py | X | Coherence des donnees |
| **Total** | **X** | ... |
]

## 10.3 Resultats des tests

[Coller le resultat de l'execution de pytest :

```
$ pytest backend/tests/ -v
[ resultat complet ]
```
]

## 10.4 Verification de la federation

[Coller le resultat du script verify-all.sh ou verify-federation.sql :

```
$ ./scripts/verify-all.sh
[ resultat complet ]
```
]

---

# 11. Guide de Deploiement

## 11.1 Pre-requis systeme

| Pre-requis | Version minimale | Verification |
|------------|-----------------|-------------|
| Docker | 25+ | `docker --version` |
| Docker Compose | 2.20+ | `docker compose version` |
| Git | 2.30+ | `git --version` |
| RAM | 8 Go minimum | — |
| Disque | 10 Go libre | — |
| CPU | 2 coeurs minimum | — |

## 11.2 Installation pas a pas

```bash
# 1. Cloner le depot
git clone <url-du-depot>
cd banque-togo-federees

# 2. Configurer les variables d'environnement
cp .env.example .env
# Editer .env avec les valeurs appropriees

# 3. Construire et demarrer les conteneurs
docker-compose up --build -d

# 4. Attendre le demarrage complet (environ 60-90 secondes)
docker-compose ps  # Verifier que tous les services sont "Up (healthy)"

# 5. Verifier l'installation
curl http://localhost:8000/api/health

# 6. Acceder a l'interface
# API : http://localhost:8000/docs
# Web : http://localhost:3000
```

## 11.3 Arret et redemarrage

```bash
# Arreter les conteneurs
docker-compose down

# Arreter et supprimer les volumes (ATTENTION : perte de donnees)
docker-compose down -v

# Redemarrer sans rebuild
docker-compose up -d

# Redemarrer avec rebuild
docker-compose up --build -d
```

## 11.4 Resolution des problemes courants

[Tableau des problemes courants et leurs solutions :

| Probleme | Cause probable | Solution |
|----------|---------------|---------|
| Conteneur postgres-hub ne demarre pas | Volume corrompu | `docker-compose down -v && docker-compose up --build` |
| Foreign tables vides | MySQL/MSSQL pas encore pret | Attendre 30s, relancer le script d'initialisation |
| Erreur 502 sur l'API | Backend pas encore demarre | Verifier les logs : `docker logs fastapi-backend` |
| Page blanche frontend | API inaccessible | Verifier CORS et le proxy Vite |
| Extension mysql_fdw absente | Compilation echouee | Verifier les logs de build Docker |
]

---

# 12. Guide d'Utilisation

## 12.1 Tableau de bord

[Decrire comment utiliser le tableau de bord :
- Indicateurs affiches
- Graphiques disponibles
- Comment rafraichir les donnees
- Signification des couleurs et badges
]

## 12.2 Recherche de clients

[Guide pas a pas pour rechercher un client :
- Recherche par nom
- Filtre par niveau de risque
- Consultation du profil complet
- Interpretation du score de risque
]

## 12.3 Suivi des credits

[Guide pour le suivi des dossiers de credit :
- Filtrage par statut
- Consultation des garanties et echeanciers
- Detection des echeances impayees
]

## 12.4 Consultation des operations comptables

[Guide pour la consultation des operations :
- Filtrage par date et type
- Lecture des ecritures comptables associees
- Verification du plan comptable OHADA
]

## 12.5 Monitoring de la federation

[Guide pour le suivi technique :
- Verification de l'etat des serveurs FDW
- Test d'acces aux foreign tables
- Rafraichissement des vues materialisees
- Interpretation des resultats de reconciliation
]

---

# 13. Problemes Connus et Limitations

## 13.1 Problemes connus

[Lister chaque probleme connu non resolu :

### [PK-001] Titre du probleme
- **Severite** : HAUTE
- **Impact** : [description]
- **Contournement** : [solution temporaire si applicable]
- **Reference** : ERR-XXX dans RAPPORT_ERREURS.md
]

## 13.2 Limitations techniques

[Lister les limitations techniques du systeme :
- Pas d'ecriture distribuee entre les bases
- Les foreign tables sont en lecture seule
- Le predicate pushdown est partiel pour tds_fdw
- Les vues materialisees ne se rafraichissent pas automatiquement
- Pas de mecanisme de cache pour les requetes federees
- Les performances dependent de la latence reseau entre conteneurs
- SQL Server dans Docker consomme beaucoup de memoire (minimum 2 Go)
- ...
]

## 13.3 Limitations fonctionnelles

[Lister les limitations fonctionnelles :
- Pas de gestion des utilisateurs et des roles
- Pas de creation de credit depuis l'interface web
- Pas d'export PDF des rapports
- Pas de notifications en temps reel
- Pas de tableau de bord historique (tendances)
- ...
]

---

# 14. Glossaire

| Terme | Definition |
|-------|-----------|
| BCEAO | Banque Centrale des Etats de l'Afrique de l'Ouest |
| FDW | Foreign Data Wrapper — extension PostgreSQL pour acceder a des donnees distantes |
| ICF | Identifiant Client Federe — identifiant unique genere par SHA-256 pour reconcilier les donnees client entre les bases |
| OHADA | Organisation pour l'Harmonisation en Afrique du Droit des Affaires |
| SQL/MED | SQL Management of External Data — norme SQL pour la gestion de donnees externes |
| SYSCOA | Systeme Comptable Ouest Africain |
| UEMOA | Union Economique et Monetaire Ouest Africaine |
| 2PC | Two-Phase Commit — protocole de validation en deux phases |
| Predicate Pushdown | Mecanisme d'optimisation qui pousse les filtres SQL vers la base distante |
| Vue federee | Vue SQL PostgreSQL qui combine des donnees locales et distantes via des foreign tables |
| Vue materialisee | Vue dont le resultat est pre-calcule et stocke, avec rafraichissement periodique |
| Hub central | PostgreSQL en tant que mediateur du systeme federe |
| Base esclave | Base de donnees connectee au hub via FDW (MySQL, SQL Server) |

---

# 15. Annexes

## Annexe A : Arborescence complete du projet

```
[Coller l'arborescence reelle du projet avec la commande tree ou find]
```

## Annexe B : Script SQL de verification de la federation

```sql
[Coller le contenu de verify-federation.sql]
```

## Annexe C : Plan comptable OHADA implemente

| Numero | Libelle | Classe |
|--------|---------|--------|
| 101000 | Capital | 1 |
| ... | ... | ... |

## Annexe D : Donnees de test (extrait)

[Extrait des donnees de seed avec quelques exemples par table]

## Annexe E : Resultats complets des tests

```
[Coller le resultat complet de pytest -v]
```

## Annexe F : Resultats du script de verification

```
[Coller le resultat complet de verify-all.sh]
```
```

---

## INSTRUCTIONS POUR L'AGENT

### Processus de redaction

1. **Lire le code reel** — Avant de rediger chaque section, lire les fichiers source reels du projet. Ne jamais se fier au document de conception initial ou aux prompts.
2. **Executer les commandes de verification** — Lancer `pytest`, `verify-all.sh`, et `verify-federation.sql` pour obtenir les resultats reels a inclure dans le document.
3. **Coller les schemas SQL reels** — Ne pas retaper les schemas de memoire. Les copier depuis les fichiers .sql du projet.
4. **Tester les endpoints API** — Executer `curl` sur chaque endpoint et capturer les reponses reelles.
5. **Capturer les plans d'execution** — Executer `EXPLAIN` sur les vues federees et coller les resultats.
6. **Mesurer les temps** — Chronometrer les temps de demarrage, de rafraichissement des vues materialisees, et de reponse des endpoints.
7. **Documenter les ecarts** — Comparer le document de conception original avec l'implementation reelle et lister tous les ecarts.

### Regles de redaction

- **Paragraphe minimum** : Chaque section doit contenir au minimum 150 mots de texte narratif (pas seulement des tableaux).
- **Pas de placeholder vide** : Chaque section doit avoir du contenu reel. Si une section n'est pas applicable, l'indiquer explicitement avec une explication.
- **Tableaux completes** : Aucune cellule de tableau ne doit etre vide. Mettre "N/A" ou "Non applicable" si necessaire.
- **Exemples reels** : Les exemples JSON, SQL et de reponses API doivent provenir de donnees reelles du systeme, pas de donnees fabriquees.
- **Chiffres verifies** : Tous les chiffres (nombre de lignes, temps de reponse, taille d'image) doivent etre mesures, pas estimes.

### Sections les plus importantes

Les sections suivantes sont les plus critiques et doivent etre particulierement soignees :

1. **Section 5 (Federation FDW)** — C'est le coeur du projet. Le jury evaluera la comprehension de la federation.
2. **Section 6 (Vues Federees)** — Demontrer que les vues fonctionnent reellement avec des resultats concrets.
3. **Section 4.4 (Correspondance des cles)** — Montrer la coherence du modele de donnees inter-bases.
4. **Section 13 (Problemes Connus)** — L'honnetete technique est valorisee. Un projet qui identifie ses limites est plus credible.
5. **Section 11 (Guide de Deploiement)** — Doit permettre a quiconque de deployer le systeme sans aide.

### Validation finale

Avant de considerer le document comme final, verifier :

- [ ] Chaque section contient du contenu reel (pas de placeholder "[a completer]")
- [ ] Les schemas SQL correspondent aux fichiers reels du projet
- [ ] Les endpoints API ont ete testes et les reponses sont reelles
- [ ] Les ecarts par rapport a la conception initiale sont documentes
- [ ] Les problemes connus sont listes honnetement
- [ ] Le guide de deploiement a ete teste sur un environnement propre
- [ ] Le glossaire couvre tous les termes techniques du domaine
- [ ] Le document peut etre presente a un jury d'examen sans modification
