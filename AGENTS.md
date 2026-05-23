# AGENTS.md - Systeme de Bases de Donnees Federees - Banque du Togo

## Project Overview

Federated database system for a Togolese commercial bank using 3 heterogeneous databases connected via Foreign Data Wrappers (FDW), with a FastAPI backend and React frontend.

**Architecture**: PostgreSQL (Hub) + MySQL (Credits/Risk) + SQL Server (Accounting/HR)
**Standards**: OHADA accounting, BCEAO/UEMOA banking norms
**Language**: French (UI, reports, comments)

---

## Quick Start

```bash
# Start all services
docker compose up -d --build

# Stop all services
docker compose down

# Rebuild and restart
docker compose down && docker compose up -d --build

# View logs
docker compose logs -f backend
docker compose logs -f postgres-hub

# Run backend tests
docker exec fastapi-backend pytest

# Access services
# Frontend:  http://localhost:3000
# Backend:   http://localhost:8000/docs (Swagger)
# PostgreSQL: localhost:5435
# MySQL:      localhost:3308
# SQL Server: localhost:1435
```

---

## Directory Structure

```
projet_fin_dba/
├── docker-compose.yml          # 5 services, shared network
├── .env                        # Credentials, VITE_API_URL
├── RAPPORT_ERREURS.md          # Error log (15 resolved)
├── README.md
│
├── backend/
│   ├── Dockerfile              # Python 3.12-slim
│   ├── pytest.ini              # asyncio_mode = auto
│   ├── requirements.txt
│   └── app/
│       ├── main.py             # FastAPI entry, 9 routers
│       ├── config.py           # pydantic-settings from .env
│       ├── database.py         # Async engines (asyncpg, aiomysql)
│       ├── exceptions.py       # Custom exceptions
│       ├── models/             # SQLAlchemy models
│       ├── routers/            # API endpoints (10 files)
│       ├── schemas/            # Pydantic models (9 files)
│       ├── services/           # Business logic (7 files)
│       └── utils/
│           └── icf_generator.py # SHA-256 ICF generation
│   └── tests/                  # pytest async tests
│
├── frontend/
│   ├── Dockerfile              # Node 20-alpine
│   ├── package.json            # React 18, Vite 5, Tailwind 4
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx             # 16 routes, sidebar nav
│       ├── api/index.js        # Axios API client
│       ├── components/         # Badge, ErrorMessage, FormatCurrency, LoadingSpinner, StatCard
│       ├── pages/              # 16 page components
│       └── utils/export.js     # CSV export utility
│
├── postgres-hub/
│   ├── Dockerfile              # postgres:16 + mysql_fdw + tds_fdw
│   ├── docker-entrypoint-wrapper.sh
│   ├── init/                   # Extensions, local tables, indexes
│   ├── fdw-init/               # FDW servers, foreign tables, views
│   ├── seed/                   # PostgreSQL seed data
│   └── post-init/post-init.sh  # Waits for MySQL/MSSQL then configures FDW
│
├── mysql-credit/
│   ├── Dockerfile              # mysql:8.0
│   ├── my.cnf
│   └── init/                   # Tables, user, seed data
│
├── mssql-compta/
│   ├── Dockerfile              # mssql/server:2022-latest
│   ├── entrypoint.sh           # Runs init + seed scripts
│   ├── init/                   # Tables, indexes, user
│   └── seed/                   # SQL Server seed data
│
└── scripts/
    ├── verify-all.sh           # Full system verification
    ├── reconcile.sh            # Run reconciliation
    └── wait-for-it.sh          # Health check helper
```

---

## Services & Ports

| Service | Container | Host Port | Internal Port | Health Check |
|---------|-----------|-----------|---------------|--------------|
| PostgreSQL Hub | postgres-hub | 5435 | 5432 | `pg_isready` |
| MySQL Credits | mysql-credit | 3308 | 3306 | `mysqladmin ping` |
| SQL Server Compta | mssql-compta | 1435 | 1433 | `sqlcmd SELECT 1` |
| FastAPI Backend | fastapi-backend | 8000 | 8000 | `curl /api/health` |
| React Frontend | react-frontend | 3000 | 3000 | -- |

**IMPORTANT**: Host ports are 5435, 3308, 1435 (not defaults) to avoid conflicts with local DB instances.

---

## Database Schema

### PostgreSQL Hub (Local Tables)
| Table | Rows | Purpose |
|-------|------|---------|
| `agence` | 5 | Bank branches (Lome, Kpalime, Sokode, Kara, Dapaong) |
| `employe` | 10 | Bank employees (2 per branch) |
| `client` | 20 | Bank clients with SHA-256 ICF |
| `compte` | 30 | Bank accounts (courant, epargne, terme) |
| `transaction` | 104 | Banking transactions |

### MySQL (Credits & Risk)
| Table | Rows | Purpose |
|-------|------|---------|
| `dossier_credit` | 15 | Loan applications |
| `garantie` | 20 | Loan guarantees |
| `echeancier` | 50 | Payment schedules |
| `scoring` | 20 | Risk scoring (0-100) |

### SQL Server (Accounting & HR)
| Table | Rows | Purpose |
|-------|------|---------|
| `plan_comptable` | 60 | OHADA chart of accounts |
| `ecriture_comptable` | 120 | Accounting entries |
| `bulletin_paie` | 20 | Payroll slips |
| `operation_agence` | 50 | Branch operations |

### FDW Foreign Tables (PostgreSQL)
| Foreign Table | Source | Rows |
|---------------|--------|------|
| `fdw_dossier_credit` | MySQL | 15 |
| `fdw_garantie` | MySQL | 20 |
| `fdw_echeancier` | MySQL | 50 |
| `fdw_scoring` | MySQL | 20 |
| `fdw_ecriture_comptable` | SQL Server | 120 |
| `fdw_plan_comptable` | SQL Server | 60 |
| `fdw_bulletin_paie` | SQL Server | 20 |
| `fdw_operation_agence` | SQL Server | 50 |

### Federated Views
| View | Sources | Purpose |
|------|---------|---------|
| `vue_client_complet` | PG + MySQL | Unified client profile with risk score |
| `vue_credit_detail` | PG + MySQL | Complete loan dossier |
| `vue_operation_comptable` | PG + SQL Server | Operations with accounting entries |
| `vue_tableau_bord` | PG + MySQL + SQL Server | KPIs per branch |

### Materialized Views
| View | Purpose |
|------|---------|
| `mv_tableau_bord` | Cached dashboard indicators |
| `mv_clients_risque_eleve` | High-risk clients (eleve/tres_eleve) |

---

## API Endpoints

### Health & Federation
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check (PG, MySQL, MSSQL) |
| GET | `/api/federation/status` | FDW connection status |

### Clients
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clients` | List clients (pagination, search, filters) |
| GET | `/api/clients/{icf}` | Get client by ICF |
| POST | `/api/clients` | Create client (auto-generates ICF) |

### Comptes (Accounts)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/comptes/` | List accounts |
| GET | `/api/comptes/stats` | Account statistics |
| GET | `/api/comptes/{id}` | Get account detail |
| POST | `/api/comptes/` | Create account |
| PUT | `/api/comptes/{id}/statut` | Update account status |
| GET | `/api/comptes/{id}/transactions` | Transaction history |

### Credits
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/credits` | List loan dossiers |
| GET | `/api/credits/{id}` | Get dossier detail |
| GET | `/api/credits/{id}/echeancier` | Get payment schedule |
| POST | `/api/credits` | Create loan application |
| PUT | `/api/credits/{id}/decision` | Approve/reject dossier |
| PUT | `/api/credits/{id}/echeancier/{id}/statut` | Update installment status |
| POST | `/api/credits/{id}/garanties` | Add guarantee |
| POST | `/api/credits/{id}/scoring` | Add risk scoring |

### Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/operations` | List accounting operations |
| POST | `/api/operations/transactions` | Create transaction |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Global KPIs |
| GET | `/api/dashboard/agence/{id}` | Branch KPIs |
| GET | `/api/dashboard/risque` | High-risk clients |
| POST | `/api/dashboard/refresh` | Refresh materialized views |

### Employes & Paie
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employes/` | List employees |
| GET | `/api/employes/paie/` | List payroll slips |
| GET | `/api/employes/paie/stats` | Payroll statistics |

### Alertes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alertes/` | List all alerts |
| GET | `/api/alertes/resume` | Alert summary |
| GET | `/api/alertes/solde-bas` | Low balance alerts |
| GET | `/api/alertes/echeances-retard` | Overdue installment alerts |
| GET | `/api/alertes/transactions-suspectes` | Suspicious transaction alerts |

### Reconciliation
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reconciliation/rapport` | ICF coherence report |
| GET | `/api/reconciliation/comptes-credits` | Account/credit coherence |
| GET | `/api/reconciliation/doublons-icf` | Duplicate ICF detection |
| POST | `/api/reconciliation/refresh` | Run full reconciliation |

### Database Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/database/postgres` | PostgreSQL info (tables, views, stats) |
| GET | `/api/database/mysql` | MySQL info (tables, triggers) |
| GET | `/api/database/mssql` | SQL Server info via FDW |
| GET | `/api/database/overview` | Combined overview |
| POST | `/api/database/query` | Execute SELECT query (read-only) |
| POST | `/api/database/refresh-views` | Refresh materialized views |

---

## Frontend Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | DashboardPage | KPIs, charts, branch summary |
| `/clients` | ClientsPage | Client list with filters |
| `/clients/:icf` | ClientDetailPage | Client detail view |
| `/comptes` | ComptesPage | Account management |
| `/credits` | CreditsPage | Loan dossier list |
| `/credits/:id` | CreditDetailPage | Credit detail view |
| `/echeanciers` | EcheanciersPage | Payment schedule management |
| `/operations` | OperationsPage | Operations list |
| `/employes` | EmployesPage | Employees & payroll |
| `/alertes` | AlertesPage | Alerts dashboard |
| `/reconciliation` | ReconciliationPage | Data coherence dashboard |
| `/federation` | FederationPage | FDW status |
| `/database` | DatabasePage | Database management |
| `/new-client` | ClientFormPage | Create client form |
| `/new-credit` | CreditFormPage | Create credit form |
| `/new-transaction` | TransactionFormPage | Create transaction form |

---

## Key Conventions

### Backend
- **Async everywhere**: Use `async/await` with SQLAlchemy async engines
- **No `pool_pre_ping`**: Incompatible with asyncpg/aiomysql
- **Use `text()` for raw SQL**: All queries use `sqlalchemy.text()`
- **Session management**: Use `get_pg_session()` or `get_mysql_session()` dependency
- **Pydantic v2**: Use `model_dump()` not `dict()`, but `dict()` still works in some contexts
- **Error handling**: Use custom exceptions from `app/exceptions.py`
- **ICF generation**: SHA-256 of `numero_piece + "TOGO_BK001"`, truncated to 64 chars

### Frontend
- **React 18 + Vite 5**: Functional components with hooks
- **Tailwind CSS v4**: Use `@tailwindcss/vite` plugin
- **lucide-react v0.330**: Available icons (no `BellAlert`, use `Bell`; no `UsersRound`, use `UserCheck`)
- **API calls**: Use functions from `src/api/index.js`
- **Currency**: Always format with `FormatCurrency` component (XOF)
- **White background**: Main area uses `bg-white`
- **French UI**: All labels, messages, and placeholders in French

### Database
- **FDW date format**: SQL Server dates come as `VARCHAR(30)` via tds_fdw, use `TO_DATE(col, 'Mon DD YYYY HH12:MI:SS:AM')` to parse
- **Seed scripts are idempotent**: PostgreSQL uses `TRUNCATE ... RESTART IDENTITY CASCADE`
- **FDW init is deferred**: `post-init.sh` waits for MySQL/MSSQL before configuring FDW
- **Foreign table columns**: SQL Server date columns must be `VARCHAR(30)` not `DATE`/`TIMESTAMP`

---

## Common Pitfalls

1. **SQL Server date format via tds_fdw**: Returns `Jan 10 2024 12:00:00:AM` -- must use `VARCHAR(30)` in foreign table and `TO_DATE()` in views
2. **FastAPI trailing slash**: `GET /api/comptes` redirects to `/api/comptes/` (307) -- frontend should use trailing slash or follow redirects
3. **lucide-react icon names**: Version 0.330 doesn't have `BellAlert` (use `Bell`) or `UsersRound` (use `UserCheck`)
4. **asyncpg/aiomysql pool_pre_ping**: Causes `missing positional argument` errors -- do NOT use it
5. **pytest-asyncio**: Requires `asyncio_mode = auto` in `pytest.ini` and `@pytest_asyncio.fixture` for async fixtures
6. **FDW initialization order**: PostgreSQL must start AFTER MySQL and MSSQL are ready
7. **ICF length**: Must be exactly 64 characters (SHA-256 hex)
8. **VITE_API_URL**: Must include `/api` suffix: `http://localhost:8000/api`
9. **Host ports**: 5435 (PG), 3308 (MySQL), 1435 (MSSQL) -- NOT the defaults
10. **Database query endpoint**: Only SELECT queries allowed -- INSERT/UPDATE/DELETE are blocked

---

## Testing

```bash
# Run all backend tests
docker exec fastapi-backend pytest -v

# Run specific test file
docker exec fastapi-backend pytest tests/test_clients.py -v

# Run with coverage (if installed)
docker exec fastapi-backend pytest --cov=app

# Frontend: no test suite configured yet
```

---

## Error Log

All errors are tracked in `RAPPORT_ERREURS.md`. As of last update:
- **15 total errors**, all **15 resolved**, **0 in progress**, **0 blocking**

---

## Environment Variables

See `.env` for full list. Key variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_HOST` | postgres-hub | PostgreSQL container name |
| `POSTGRES_PORT` | 5432 | Internal port (host: 5435) |
| `MYSQL_HOST` | mysql-credit | MySQL container name |
| `MYSQL_PORT` | 3306 | Internal port (host: 3308) |
| `VITE_API_URL` | http://localhost:8000/api | Frontend API base URL |

---

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Database Hub | PostgreSQL | 16 |
| Database Credits | MySQL | 8.0 |
| Database Compta | SQL Server | 2022 |
| FDW Extensions | mysql_fdw, tds_fdw | latest (master) |
| Backend | FastAPI + Uvicorn | 0.110+ |
| Backend ORM | SQLAlchemy (async) | 2.0.25+ |
| Backend Drivers | asyncpg, aiomysql | latest |
| Frontend | React + Vite | 18 / 5 |
| Frontend CSS | Tailwind CSS | 4 |
| Frontend Charts | Recharts | 2.12 |
| Frontend Icons | lucide-react | 0.330 |
| Containerization | Docker Compose | v2 |
