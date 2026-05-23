# Analyse Critique — FedBank Togo

**Projet** : Système de bases de données fédérées pour une banque commerciale au Togo  
**Public** : jury d'examen, complément à [presentation.md](./presentation.md)

---

## 1. Synthèse

Le projet répond au cahier des charges : trois SGBD hétérogènes restent autonomes, PostgreSQL sert de **hub de lecture fédérée**, une API et une interface unifient l'accès. La démonstration est **reproductible** (Docker), **documentée** (15 erreurs tracées) et **alignée** sur un contexte bancaire ouest-africain (OHADA, XOF, ICF).

---

## 2. Points forts

### 2.1 Modèle de fédération

- **FDW natifs** (`mysql_fdw`, `tds_fdw`) : jointures SQL sans ETL batch — données quasi temps réel.
- **Vues métier** (`vue_client_complet`, `vue_tableau_bord`) : abstraction utile pour le backend et la soutenance.
- **Vues matérialisées** : compromis performance / fraîcheur explicite (refresh à la demande).

### 2.2 Ingénierie logicielle

- Stack moderne cohérente : FastAPI async, React, conteneurisation complète.
- **Observabilité** : Prometheus, Grafana, métriques FDW custom — rare à ce niveau pour un projet académique.
- **Réconciliation ICF** : traitement d'un vrai problème d'intégration inter-systèmes.

### 2.3 Qualité opérationnelle

- Seeds idempotents, `post-init.sh` pour l'ordre de démarrage FDW.
- Journal d'erreurs structuré — démontre une démarche itérative crédible devant le jury.

---

## 3. Limites et risques

| Limite | Impact | Piste d'amélioration |
|--------|--------|----------------------|
| Pas d'authentification (JWT/RBAC) | Démo uniquement, pas production | Middleware FastAPI + rôles métier |
| Écritures directes MySQL via API | Pas de transaction distribuée 2PC | Saga ou orchestration par domaine |
| Latence FDW sur grosses jointures | Dashboard lent si MV non rafraîchies | Cache Redis, pagination FDW |
| Dates SQL Server en `VARCHAR(30)` | Dette technique tds_fdw | ETL léger ou vue matérialisée dédiée |
| 12 tests backend, pas d'E2E frontend | Régression UI non couverte | Playwright sur parcours crédit |
| Données de démo (~500 lignes) | Comportement à l'échelle non prouvé | Benchmarks `EXPLAIN` sur vues fédérées |

---

## 4. Choix techniques — justification

### Retenu : PostgreSQL comme hub

**Pour** : écosystème FDW mature, SQL pour les jointures, une seule connexion côté API pour la majorité des lectures.  
**Contre** : SQL Server Linked Server ou ETL — plus lourds ou non temps réel.

### Retenu : pas de migration unique

**Pour** : réalisme bancaire (héritage multi-SGBD), délai de projet maîtrisé.  
**Contre** : complexité opérationnelle permanente (3 backups, 3 montées de version).

### Retenu : ICF SHA-256

**Pour** : réconciliation sans stocker la pièce d'identité en clair.  
**Contre** : pas de réversibilité — perte du numéro de pièce si seul l'ICF est conservé ailleurs.

---

## 5. Cohérence avec le métier

- **OHADA** : plan comptable et écritures dans SQL Server — crédible pour la compta.
- **BCEAO/UEMOA** : contexte réglementaire mentionné ; le prototype ne implémente pas de reporting prudentiel complet (normal pour un MVP académique).
- **Parcours crédit** : couvert de la demande au scoring — bon fil conducteur pour la démo live.

---

## 6. Verdict pour la soutenance

| Critère | Appréciation |
|---------|--------------|
| Compréhension DBA / fédération | Excellente |
| Implémentation fonctionnelle | Complète |
| Documentation | Très fournie |
| Maturité production | Limitée (volontairement) |
| Originalité | Bonne (monitoring + réconciliation + 3 SGBD réels) |

**Message à porter au jury** : le projet prouve la **faisabilité** d'une vue unifiée sans big bang migration ; les limites listées ci-dessus sont des **évolutions naturelles**, pas des échecs de conception.

---

## 7. Questions probables du jury

1. *Pourquoi ne pas tout mettre dans PostgreSQL ?* → Coût, risque, spécificités OHADA/SQL Server existantes.
2. *Performance des FDW ?* → Vues matérialisées + refresh ; latence acceptable sur jeu de test.
3. *Cohérence transactionnelle ?* → Pas de 2PC ; cohérence assurée par ICF et module réconciliation.
4. *Sécurité des données ?* → ICF pseudonymisant ; requêtes SQL en lecture seule côté console DBA.

---

*Voir aussi : [documentation_projet.md](./documentation_projet.md) · [../RAPPORT_ERREURS.md](../RAPPORT_ERREURS.md)*
