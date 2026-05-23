# Dossier Présentation — FedBank Togo

Support de soutenance pour le projet **Système de Bases de Données Fédérées** (Banque Commerciale du Togo).

## Fichiers et rôles

| Fichier | Usage |
|---------|--------|
| **[presentation.md](./presentation.md)** | Script oral — 25 diapositives, notes orateur, diagrammes Mermaid |
| **[documentation_projet.md](./documentation_projet.md)** | Référence technique complète (architecture, API, FDW, déploiement) |
| **[analyse_critique.md](./analyse_critique.md)** | Analyse pour le jury : forces, limites, choix techniques |
| **[deck/](./deck/)** | Slides HTML 1280×720 + `slides.json` + export PDF/PPTX |
| **[site/index.html](./site/index.html)** | Aperçu web statique du projet |

## Cartographie du dépôt `projet_fin_dba/`

```
projet_fin_dba/
├── docker-compose.yml      # 10 services Docker (3 DB + API + UI + monitoring)
├── .env                    # Secrets et URLs (non versionner en prod)
├── AGENTS.md               # Conventions développeur / agent
├── RAPPORT_ERREURS.md      # 15 incidents documentés et résolus
├── README.md               # Démarrage rapide
│
├── postgres-hub/           # Hub PostgreSQL 16 + mysql_fdw + tds_fdw
│   ├── init/               # Extensions, tables locales, index
│   ├── fdw-init/           # Serveurs FDW, foreign tables, vues
│   ├── seed/               # Données de démo (idempotent)
│   └── post-init/          # Attente MySQL/MSSQL puis config FDW
│
├── mysql-credit/           # Crédits, garanties, échéanciers, scoring
├── mssql-compta/           # OHADA, écritures, paie, opérations agence
│
├── backend/                # FastAPI 3.12, SQLAlchemy async, pytest
│   └── app/
│       ├── routers/        # 9 routeurs métier
│       ├── services/       # Logique (fédération, réconciliation, alertes…)
│       └── tests/          # 12 tests async
│
├── frontend/               # React 18, Vite 5, Tailwind 4 — 17 routes
├── prometheus/             # Scrape FastAPI + exporters
├── grafana/                # Dashboard API provisionné
├── scripts/                # verify-all.sh, reconcile.sh
└── presentation/           # Ce dossier
```

## Chiffres clés (état du code — mai 2026)

| Indicateur | Valeur |
|------------|--------|
| SGBD | PostgreSQL 16, MySQL 8.0, SQL Server 2022 |
| Conteneurs Docker | **10** |
| Foreign tables | 8 |
| Vues fédérées | 4 (+ 2 matérialisées) |
| Routeurs API | 9 (+ `/api/health`, `/api/federation/status` dans `main.py`) |
| Pages React | **17** (dont Monitoring) |
| Tests backend | **12** (pytest-asyncio) |
| Erreurs résolues | 15 / 15 (`RAPPORT_ERREURS.md`) |

## Démarrage pour la démo

```bash
cd projet_fin_dba
docker compose up -d --build
```

| Service | URL |
|---------|-----|
| Interface | http://localhost:3000 |
| API / Swagger | http://localhost:8000/docs |
| Grafana | http://localhost:3001 (admin / Grafana2025!) |
| Prometheus | http://localhost:9090 |

## Exporter les slides HTML

```bash
cd presentation/deck
python3 generate_slides.py   # si script d’export configuré
# ou ouvrir chaque slide_*.html dans Chrome → Imprimer → PDF
```

Le contenu source des slides HTML est aligné sur **presentation.md** (même plan en 25 sections).

## Documents racine utiles

- `08_DOCUMENT_SPECIFICATION.md` — cahier des charges
- `09_PRESENTATION_DIAGRAMMES.md` — gabarit jury avec diagrammes Mermaid
- `implementation_plan.md` — plan d’implémentation

---

*Master — Systèmes d'Information et Bases de Données · Mai 2026*
