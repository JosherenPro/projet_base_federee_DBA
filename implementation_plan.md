# Plan d'Amélioration du Projet de Bases de Données Fédérées

Ce plan vise à améliorer la robustesse du projet en résolvant plusieurs problèmes identifiés au niveau de la base de données PostgreSQL, de l'API FastAPI et de la suite de tests unitaires.

## Problèmes identifiés & Améliorations proposées

1. **Restauration de la santé de l'API (Health Check Dégradé)**
   - **Problème** : L'API `/api/health` indique que la connexion avec MySQL est dégradée. L'erreur dans les logs est : `MySQL error: AsyncAdapt_aiomysql_connection.ping() missing 1 required positional argument: 'reconnect'`.
   - **Cause** : Un bug de signature entre la version de SQLAlchemy (2.0.25+) et le pilote `aiomysql` (0.2.0+) lors de l'exécution du pre-ping de pool.
   - **Solution** : Désactiver l'option `pool_pre_ping=True` sur le moteur de connexion `mysql_engine` dans [database.py](file:///home/eren/Documents/projet_s6/DBA/projet_fin_dba/backend/app/database.py). Le health check continuera de fonctionner en exécutant directement une requête simple (`SELECT 1`).

2. **Absence de Transactions dans la Base PostgreSQL (Erreur de Seed)**
   - **Problème** : Le script de vérification `./scripts/verify-all.sh` montre que la table `transaction` contient 0 ligne, alors que le fichier de seed en déclare 100.
   - **Cause** : Le script `seed_postgres.sql` a été exécuté plusieurs fois ou sur une base non réinitialisée. Les identifiants de comptes (`id_compte`) auto-incrémentés ont commencé à 31 au lieu de 1, provoquant des violations de clé étrangère sur l'insertion des transactions qui ciblent les IDs 1 à 30 de manière statique.
   - **Solution** : Ajouter une instruction `TRUNCATE TABLE transaction, compte, client, employe, agence RESTART IDENTITY CASCADE;` au début de [seed_postgres.sql](file:///home/eren/Documents/projet_s6/DBA/projet_fin_dba/postgres-hub/seed/seed_postgres.sql) afin de garantir que l'insertion des données de test repart de zéro avec des séquences réinitialisées à 1, rendant le script idempotent.

3. **Correction de la Suite de Tests Backend**
   - **Problème 1** : Lancer `pytest` retourne des avertissements critiques `PytestRemovedIn9Warning` concernant les fixtures asynchrones.
     - *Solution* : Ajouter un fichier [pytest.ini](file:///home/eren/Documents/projet_s6/DBA/projet_fin_dba/backend/pytest.ini) avec `asyncio_mode = auto` configuré.
   - **Problème 2** : Les tests échouent avec `RuntimeError: Event loop is closed`.
     - *Solution* : Définir une fixture `event_loop` de portée `session` dans [conftest.py](file:///home/eren/Documents/projet_s6/DBA/projet_fin_dba/backend/tests/conftest.py) pour partager la même boucle d'événements entre les tests asynchrones.
   - **Problème 3** : Redondance et mauvaise structure. La fixture `client` est redéfinie dans chaque fichier de test, et des fonctions de test sont déclarées directement dans `conftest.py`.
     - *Solution* : Supprimer les définitions redondantes de `client` dans [test_clients.py](file:///home/eren/Documents/projet_s6/DBA/projet_fin_dba/backend/tests/test_clients.py), [test_credits.py](file:///home/eren/Documents/projet_s6/DBA/projet_fin_dba/backend/tests/test_credits.py), [test_federation.py](file:///home/eren/Documents/projet_s6/DBA/projet_fin_dba/backend/tests/test_federation.py) et [test_reconciliation.py](file:///home/eren/Documents/projet_s6/DBA/projet_fin_dba/backend/tests/test_reconciliation.py). Supprimer également les fonctions de tests de `conftest.py`.

---

## Modifications Proposées par Fichier

### Base de données Hub & Seeding

#### [MODIFY] [seed_postgres.sql](file:///home/eren/Documents/projet_s6/DBA/projet_fin_dba/postgres-hub/seed/seed_postgres.sql)
- Ajout de la commande de vidage de tables et de réinitialisation des séquences :
  ```sql
  TRUNCATE TABLE transaction, compte, client, employe, agence RESTART IDENTITY CASCADE;
  ```

### Backend (FastAPI)

#### [MODIFY] [database.py](file:///home/eren/Documents/projet_s6/DBA/projet_fin_dba/backend/app/database.py)
- Retrait de `pool_pre_ping=True` de la création de `mysql_engine`.

#### [NEW] [pytest.ini](file:///home/eren/Documents/projet_s6/DBA/projet_fin_dba/backend/pytest.ini)
- Création du fichier de configuration pytest :
  ```ini
  [pytest]
  asyncio_mode = auto
  ```

#### [MODIFY] [conftest.py](file:///home/eren/Documents/projet_s6/DBA/projet_fin_dba/backend/tests/conftest.py)
- Ajout de la fixture `event_loop` à portée session.
- Retrait des fonctions de test définies par erreur dans ce fichier.

#### [MODIFY] [test_clients.py](file:///home/eren/Documents/projet_s6/DBA/projet_fin_dba/backend/tests/test_clients.py)
- Suppression de la fixture `client` locale.

#### [MODIFY] [test_credits.py](file:///home/eren/Documents/projet_s6/DBA/projet_fin_dba/backend/tests/test_credits.py)
- Suppression de la fixture `client` locale.

#### [MODIFY] [test_federation.py](file:///home/eren/Documents/projet_s6/DBA/projet_fin_dba/backend/tests/test_federation.py)
- Suppression de la fixture `client` locale.

#### [MODIFY] [test_reconciliation.py](file:///home/eren/Documents/projet_s6/DBA/projet_fin_dba/backend/tests/test_reconciliation.py)
- Suppression de la fixture `client` locale.

---

## Plan de Vérification

### 1. Seeding et Comptes
- Ré-exécuter le script de seed PostgreSQL :
  `docker exec -i postgres-hub psql -U banque_admin -d banque_hub < postgres-hub/seed/seed_postgres.sql`
- Vérifier que la table `transaction` contient maintenant 100 lignes.
- Vérifier que le script de vérification `./scripts/verify-all.sh` s'exécute avec succès et affiche un statut `healthy` pour le backend API et le healthcheck MySQL.

### 2. Validation des Tests Unitaires
- Lancer la suite de tests unitaires avec `pytest` depuis le conteneur du backend :
  `docker exec fastapi-backend pytest`
- S'assurer que tous les tests passent sans erreur de boucle d'événement fermée ou d'avertissement asyncio.
