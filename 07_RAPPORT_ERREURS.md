# PROMPT 07 - Rapport d'Erreurs (RAPPORT_ERREURS.md)

## OBJECTIF

Ce prompt definit les regles et la structure pour documenter **toute erreur, avertissement ou probleme** rencontre lors de l'implementation du systeme de bases de donnees federees dans un fichier `RAPPORT_ERREURS.md` place a la racine du projet.

## REGLES FONDAMENTALES

1. **Chaque erreur doit etre documentee immediatement** — ne pas attendre la fin de l'implementation
2. **Aucune erreur ne doit etre ignoree ou masquee** — meme si elle a ete resolue, elle figure dans le rapport
3. **Le rapport est un fichier vivant** — il est mis a jour a chaque fois qu'une nouvelle erreur est detectee ou qu'une erreur existante est resolue
4. **Le rapport doit etre lisible par un humain** — clair, structure, avec du contexte suffisant pour comprendre et reproduire le probleme
5. **Le rapport est en FRANCAIS**

## STRUCTURE DU FICHIER RAPPORT_ERREURS.md

Le fichier doit suivre exactement cette structure :

```markdown
# Rapport d'Erreurs - Systeme de BDD Federees Banque du Togo

**Derniere mise a jour** : [AAAA-MM-JJ HH:MM]
**Nombre total d'erreurs** : [X]
**Erreurs resolues** : [Y]
**Erreurs en cours** : [Z]
**Erreurs bloqueantes** : [W]

---

## Resume par Categorie

| Categorie | Total | Resolues | En cours | Bloquantes |
|-----------|-------|----------|----------|------------|
| Docker / Infrastructure | 0 | 0 | 0 | 0 |
| PostgreSQL / FDW | 0 | 0 | 0 | 0 |
| MySQL | 0 | 0 | 0 | 0 |
| SQL Server | 0 | 0 | 0 | 0 |
| Backend FastAPI | 0 | 0 | 0 | 0 |
| Frontend React | 0 | 0 | 0 | 0 |
| Federation / Vues | 0 | 0 | 0 | 0 |
| Donnees / Seed | 0 | 0 | 0 | 0 |
| **TOTAL** | **0** | **0** | **0** | **0** |

---

## Journal des Erreurs

### [ERR-001] Titre court de l'erreur

| Champ | Valeur |
|-------|--------|
| **ID** | ERR-001 |
| **Severite** | CRITIQUE / HAUTE / MOYENNE / BASSE |
| **Statut** | OUVERTE / EN_COURS / RESOLUE / DIFFEREE |
| **Categorie** | Docker / PostgreSQL / MySQL / SQL Server / Backend / Frontend / Federation / Seed |
| **Date detection** | AAAA-MM-JJ HH:MM |
| **Date resolution** | AAAA-MM-JJ HH:MM (ou vide si non resolue) |
| **Prompt source** | 01 / 02 / 03 / 04 / 05 / 06 |
| **Fichier(s) concerne(s)** | chemin/vers/fichier |

**Description du probleme** :
[Description detaillee du probleme en 3-10 lignes. Que se passe-t-il ? Quel est le comportement observe ?]

**Contexte** :
[Dans quelles circonstances l'erreur est-elle survenue ? Quelle etape etait en cours ? Quelle commande a ete executee ?]

**Message d'erreur complet** :
```
[Coller le message d'erreur exact, stack trace, ou log complet ici]
```

**Etapes pour reproduire** :
1. [Etape 1]
2. [Etape 2]
3. [Etape 3]

**Cause racine** :
[Apres analyse, quelle est la cause profonde du probleme ? Si inconnue, l'indiquer.]

**Solution appliquee (si resolue)** :
[Description de la correction appliquee. Quel fichier a ete modifie ? Quelle ligne ?]

**Solution de contournement (si differree)** :
[Si l'erreur n'est pas resolue mais contournee, decrire la solution temporaire.]

**Impact** :
[Quel est l'impact sur le systeme ? Fonctionnalite cassee ? Performance degradee ? Donnees incoherentes ?]

**Liens / References** :
[Liens vers la documentation, issues GitHub, Stack Overflow, ou toute reference utile]

---

### [ERR-002] Titre court de l'erreur

[Meme structure que ERR-001]

---
```

## SEVERITES DES ERREURS

| Severite | Definition | Exemple |
|----------|------------|---------|
| **CRITIQUE** | Le systeme ne peut pas demarrer ou une fonctionnalite majeure est completement cassee | Docker ne demarre pas, FDW ne s'installe pas, vues federees inaccessibles |
| **HAUTE** | Une fonctionnalite importante ne fonctionne pas correctement mais le systeme peut tourner | Un endpoint API retourne une erreur 500, une foreign table ne retourne pas de donnees |
| **MOYENNE** | Une fonctionnalite secondaire est affectee ou le comportement n'est pas celui attendu | Pagination incorrecte, filtre qui ne fonctionne pas, format de donnees errone |
| **BASSE** | Probleme cosmetique ou mineur qui n'affecte pas la fonctionnalite | Warning dans les logs, texte mal formaté, icone manquante |

## CATEGORIES DETAILLEES

### Docker / Infrastructure
- Erreurs de build Docker, de reseau, de volumes, de ports, de healthchecks
- Erreurs de demarrage de conteneurs
- Problemes de communication inter-conteneurs

### PostgreSQL / FDW
- Erreurs d'installation des extensions mysql_fdw / tds_fdw
- Erreurs de compilation des extensions FDW
- Erreurs de connexion aux serveurs distants
- Erreurs de creation de foreign tables
- Erreurs de trigger (ICF)
- Erreurs d'index

### MySQL
- Erreurs de creation de tables, d'index, de contraintes
- Erreurs de charset (utf8mb4)
- Erreurs de trigger (niveau_risque)
- Erreurs de connexion FDW

### SQL Server
- Erreurs de creation de tables, d'index
- Erreurs d'authentification (sa / fdw_user)
- Erreurs de conformite OHADA
- Erreurs de script d'initialisation (pas de /docker-entrypoint-initdb.d/)

### Backend FastAPI
- Erreurs de connexion aux bases de donnees
- Erreurs de modele SQLAlchemy
- Erreurs de validation Pydantic
- Erreurs d'endpoint (404, 500, etc.)
- Erreurs de configuration (CORS, variables d'environnement)

### Frontend React
- Erreurs de build (Vite, npm)
- Erreurs d'appel API (CORS, timeout)
- Erreurs d'affichage (donnees manquantes, formatage)
- Erreurs de routage

### Federation / Vues
- Erreurs de jointures federees
- Erreurs de predicate pushdown
- Erreurs de vues materialisees
- Incoherences de donnees entre les bases
- Erreurs de mapping inter-schemas

### Donnees / Seed
- Donnees incoherentes (ICF qui ne correspondent pas)
- Violations de contraintes (unicite, cles etrangeres)
- Donnees manquantes ou incompletes
- Montants ou dates irrealistes

## INSTRUCTIONS POUR L'AGENT

### Quand documenter une erreur

Documenter une erreur dans `RAPPORT_ERREURS.md` dans les cas suivants :

1. **Une commande echoue** (docker-compose up, pytest, curl, requete SQL, etc.)
2. **Un conteneur ne demarre pas** ou s'arrete inopinement
3. **Une requete SQL retourne une erreur** ou un resultat inattendu
4. **Un endpoint API retourne un code d'erreur** (4xx, 5xx)
5. **Un test echoue**
6. **Une foreign table est inaccessible** ou retourne 0 lignes alors qu'elle devrait en contenir
7. **Les donnees sont incoherentes** entre les bases (ICF absent, montants incorrects)
8. **Un warning important** est emis par un outil (Docker, PostgreSQL, FastAPI)
9. **Le comportement observe differe** du comportement attendu specifie dans les prompts 01-06
10. **Un contournement temporaire** a ete applique au lieu d'une vraie correction

### Quand NE PAS documenter

Ne pas documenter dans les cas suivants :
- Simple message d'information dans les logs (niveau INFO)
- Avertissement mineur sans impact fonctionnel
- Erreur de syntaxe corrigee immediatement avant validation

### Processus de mise a jour

1. **Detection** : L'agent detecte une erreur
2. **Numero** : Attribuer le prochain numero d'erreur (ERR-XXX) en incrementant le dernier numero utilise
3. **Documentation** : Remplir tous les champs de la structure d'erreur
4. **Resume** : Mettre a jour le tableau de resume et les compteurs en tete du fichier
5. **Resolution** : Si l'erreur est resolue, mettre a jour le statut et ajouter la solution
6. **Verification** : S'assurer que la correction ne provoque pas de regression

### Format des messages d'erreur

- **Toujours coller le message d'erreur complet** — ne jamais le paraphraser
- Inclure la **stack trace** complete si disponible
- Si le message est trop long (> 100 lignes), inclure les **50 premieres lignes** et les **20 dernieres lignes** avec un commentaire `[... tronque ...]`
- Pour les erreurs SQL, inclure la **requete complete** qui a echoue
- Pour les erreurs Docker, inclure les **logs du conteneur** (`docker logs <conteneur>`)

### Cas particuliers

#### Erreurs liees a la federation (les plus importantes)

Les erreurs de federation sont les plus critiques car elles affectent le coeur du systeme. Pour ces erreurs, ajouter une section supplementaire :

```markdown
**Diagnostic de federation** :
- PostgreSQL est-il accessible ? [OUI/NON]
- MySQL est-il accessible depuis PostgreSQL ? [OUI/NON]
- SQL Server est-il accessible depuis PostgreSQL ? [OUI/NON]
- Les extensions mysql_fdw et tds_fdw sont-elles installees ? [OUI/NON]
- Les serveurs distants sont-ils declares ? [OUI/NON]
- Les user mappings sont-ils corrects ? [OUI/NON]
- Les foreign tables retournent-elles des donnees ? [OUI/NON]
- Resultat de `EXPLAIN` sur la requete federee : [coller le resultat]
```

#### Erreurs liees a l'ICF (coherence des donnees)

Pour les erreurs d'ICF, documenter :
```markdown
**Diagnostic ICF** :
- ICF dans PostgreSQL : [valeur]
- ICF dans MySQL : [valeur ou ABSENT]
- ICF dans SQL Server : [valeur ou ABSENT]
- numero_piece utilise : [valeur]
- code_banque utilise : [valeur]
- Resultat SHA-256 attendu : [valeur]
- Resultat SHA-256 obtenu : [valeur]
```

#### Erreurs de compilation FDW (tres frequentes)

Pour les erreurs de compilation de mysql_fdw ou tds_fdw dans le conteneur PostgreSQL :
```markdown
**Diagnostic compilation FDW** :
- Version de PostgreSQL : [valeur]
- OS du conteneur : [valeur]
- Paquets de compilation installes : [liste]
- Version de mysql_fdw clonee : [commit/branche]
- Version de tds_fdw clonee : [commit/branche]
- Sortie complete de `make` : [coller]
- Sortie complete de `make install` : [coller]
```

## CHECKLIST DE FIN DE PROJET

A la fin de l'implementation, verifier :

- [ ] Le fichier `RAPPORT_ERREURS.md` existe a la racine du projet
- [ ] Toutes les erreurs rencontrees sont documentees
- [ ] Les compteurs en tete du fichier sont a jour
- [ ] Le tableau de resume est correct
- [ ] Aucune erreur CRITIQUE ou HAUTE n'est en statut OUVERTE
- [ ] Les erreurs resolues ont leur solution documentee
- [ ] Les erreurs differrees ont une solution de contournement documentee
- [ ] Le fichier est lisible et coherent

## EXEMPLE D'ENTREE

Voici un exemple complet d'une erreur documentee :

```markdown
### [ERR-001] Extension mysql_fdw non compilee dans le conteneur PostgreSQL

| Champ | Valeur |
|-------|--------|
| **ID** | ERR-001 |
| **Severite** | CRITIQUE |
| **Statut** | RESOLUE |
| **Categorie** | PostgreSQL / FDW |
| **Date detection** | 2025-03-15 14:30 |
| **Date resolution** | 2025-03-15 15:45 |
| **Prompt source** | 01 |
| **Fichier(s) concerne(s)** | postgres-hub/Dockerfile |

**Description du probleme** :
L'extension mysql_fdw ne se compile pas dans le conteneur PostgreSQL. La commande `CREATE EXTENSION mysql_fdw` echoue avec l'erreur "could not open extension control file". Le paquet libmysqlclient-dev est bien installe mais le compilateur ne trouve pas les headers MySQL.

**Contexte** :
Compilation du Dockerfile postgres-hub. Etape de build de mysql_fdw depuis les sources GitHub.

**Message d'erreur complet** :
```
Step 8/15 : RUN cd /tmp/mysql_fdw && make USE_PGXS=1
 ---> Running in a1b2c3d4e5f6
gcc -Wall -Wmissing-prototypes -Wpointer-arith -Wdeclaration-after-statement -Werror=vla -Wendif-labels -Wmissing-format-attribute -Wformat-security -fno-strict-aliasing -fwrapv -fexcess-precision=standard -Wno-format-truncation -g -g -O2 -fstack-protector-strong -Wformat -Werror=format-security -fPIC -I./ -I/usr/include/postgresql/server -I/usr/include/postgresql/internal -D_GNU_SOURCE -I/usr/include/libxml2 -c -o connection.o connection.c
connection.c:35:10: fatal error: mysql.h: Aucun fichier ou dossier de ce type
   35 | #include <mysql.h>
      |          ^~~~~~~~
compilation terminated.
make: *** [<builtin>: connection.o] Error 1
```

**Etapes pour reproduire** :
1. Executer `docker-compose build postgres-hub`
2. Observer l'echec a l'etape de compilation de mysql_fdw

**Cause racine** :
Le paquet `libmysqlclient-dev` installe les headers MySQL dans `/usr/include/mariadb/` et non dans `/usr/include/mysql/`. Le compilateur gcc ne trouve pas `mysql.h` car le chemin d'inclusion n'est pas correct.

**Solution appliquee** :
Ajout d'un lien symbolique dans le Dockerfile :
```dockerfile
RUN ln -s /usr/include/mariadb /usr/include/mysql
```
Et ajout du flag `CFLAGS="-I/usr/include/mariadb"` a la commande make :
```dockerfile
RUN cd /tmp/mysql_fdw && make USE_PGXS=1 CFLAGS="-I/usr/include/mariadb" && make USE_PGXS=1 install
```

**Impact** :
Bloquant — sans mysql_fdw, aucune foreign table MySQL n'est accessible, les vues federees sont inutilisables.

**Liens / References** :
- https://github.com/EnterpriseDB/mysql_fdw/issues/173
- https://stackoverflow.com/questions/74456728/mysql-h-not-found-when-compiling-mysql-fdw
```
