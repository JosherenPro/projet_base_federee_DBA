from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from sqlalchemy import text
from prometheus_client import Gauge, Counter, Histogram
import logging
import time

from app.config import settings
from app.database import pg_engine, mysql_engine, close_connections
from app.routers import clients, credits, operations, dashboard, comptes, employes, alertes, reconciliation, database

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

db_connections_gauge = Gauge('db_connections_active', 'Nombre de connexions actives', ['database'])
db_query_counter = Counter('db_queries_total', 'Nombre total de requetes executees', ['database', 'status'])
db_query_duration = Histogram('db_query_duration_seconds', 'Duree des requetes', ['database'])
fdw_status_gauge = Gauge('fdw_connection_status', 'Statut des connexions FDW', ['server'])

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Systeme de Bases de Donnees Federees pour l'Optimisation des Performances d'une Banque Commerciale au Togo"
)

Instrumentator().instrument(app).expose(app, endpoint="/metrics")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(clients.router)
app.include_router(credits.router)
app.include_router(operations.router)
app.include_router(dashboard.router)
app.include_router(comptes.router)
app.include_router(employes.router)
app.include_router(alertes.router)
app.include_router(reconciliation.router)
app.include_router(database.router)

@app.on_event("startup")
async def startup():
    logger.info("Demarrage du systeme de bases de donnees federees")

@app.on_event("shutdown")
async def shutdown():
    logger.info("Arret du systeme")
    await close_connections()

@app.get("/api/health", tags=["Health"])
async def health_check():
    status = {"postgresql": False, "mysql": False, "mssql": False}

    try:
        start = time.time()
        async with pg_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            status["postgresql"] = True
        db_query_duration.labels(database="postgresql").observe(time.time() - start)
        db_query_counter.labels(database="postgresql", status="success").inc()
    except Exception as e:
        logger.error(f"PostgreSQL error: {e}")
        db_query_counter.labels(database="postgresql", status="error").inc()

    try:
        start = time.time()
        async with mysql_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            status["mysql"] = True
        db_query_duration.labels(database="mysql").observe(time.time() - start)
        db_query_counter.labels(database="mysql", status="success").inc()
    except Exception as e:
        logger.error(f"MySQL error: {e}")
        db_query_counter.labels(database="mysql", status="error").inc()

    try:
        start = time.time()
        async with pg_engine.connect() as conn:
            result = await conn.execute(text("SELECT COUNT(*) FROM fdw_ecriture_comptable"))
            status["mssql"] = True
        db_query_duration.labels(database="mssql").observe(time.time() - start)
        db_query_counter.labels(database="mssql", status="success").inc()
        fdw_status_gauge.labels(server="mssql").set(1)
    except Exception as e:
        logger.error(f"MSSQL error via FDW: {e}")
        db_query_counter.labels(database="mssql", status="error").inc()
        fdw_status_gauge.labels(server="mssql").set(0)

    fdw_status_gauge.labels(server="mysql").set(1 if status["mysql"] else 0)

    db_connections_gauge.labels(database="postgresql").set(1 if status["postgresql"] else 0)
    db_connections_gauge.labels(database="mysql").set(1 if status["mysql"] else 0)
    db_connections_gauge.labels(database="mssql").set(1 if status["mssql"] else 0)

    all_healthy = all(status.values())
    return {
        "status": "healthy" if all_healthy else "degraded",
        "databases": status
    }

@app.get("/api/federation/status", tags=["Federation"])
async def federation_status():
    status = {
        "mysql_server": {"status": "unknown", "tables": 0},
        "mssql_server": {"status": "unknown", "tables": 0}
    }

    try:
        async with pg_engine.connect() as conn:
            result = await conn.execute(text("SELECT COUNT(*) FROM fdw_dossier_credit"))
            count = result.scalar()
            status["mysql_server"] = {"status": "connected", "tables": 4, "rows": count}
    except Exception as e:
        status["mysql_server"] = {"status": "error", "error": str(e)}

    try:
        async with pg_engine.connect() as conn:
            result = await conn.execute(text("SELECT COUNT(*) FROM fdw_ecriture_comptable"))
            count = result.scalar()
            status["mssql_server"] = {"status": "connected", "tables": 4, "rows": count}
    except Exception as e:
        status["mssql_server"] = {"status": "error", "error": str(e)}

    return {
        "federation": status,
        "views": {
            "vue_client_complet": "active",
            "vue_credit_detail": "active",
            "vue_operation_comptable": "active",
            "vue_tableau_bord": "active"
        }
    }
