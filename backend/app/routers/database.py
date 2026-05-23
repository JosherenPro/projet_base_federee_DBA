from fastapi import APIRouter, Depends, Query, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.database import get_pg_session, get_mysql_session, pg_session_factory
from app.services import database_service
from typing import Optional
import logging

router = APIRouter(prefix="/api/database", tags=["Gestion Bases de Donnees"])
logger = logging.getLogger(__name__)

@router.get("/postgres")
async def info_postgres(session: AsyncSession = Depends(get_pg_session)):
    return await database_service.obtenir_info_postgres(session)

@router.get("/mysql")
async def info_mysql(mysql_session: AsyncSession = Depends(get_mysql_session)):
    return await database_service.obtenir_info_mysql(mysql_session)

@router.get("/mssql")
async def info_mssql(session: AsyncSession = Depends(get_pg_session)):
    return await database_service.obtenir_info_mssql_via_fdw(session)

@router.get("/overview")
async def database_overview(
    pg_session: AsyncSession = Depends(get_pg_session),
    mysql_session: AsyncSession = Depends(get_mysql_session)
):
    pg_info = await database_service.obtenir_info_postgres(pg_session)
    mysql_info = await database_service.obtenir_info_mysql(mysql_session)

    async with pg_session_factory() as mssql_session:
        mssql_info = {}
        mssql_ok = True
        for table in ["ecriture_comptable", "plan_comptable", "bulletin_paie", "operation_agence"]:
            try:
                result = await mssql_session.execute(text(f"SELECT COUNT(*) as count FROM fdw_{table}"))
                row = result.mappings().first()
                mssql_info[table] = {"row_count": row["count"] if row else 0}
            except Exception as e:
                logger.error(f"MSSQL FDW error for {table}: {e}")
                mssql_info[table] = {"row_count": 0, "status": "error"}
                mssql_ok = False
        mssql_info["total_foreign_tables"] = 4

    return {
        "postgresql": {
            "version": pg_info.get("version", {}),
            "size": pg_info.get("db_size", {}),
            "tables": pg_info.get("table_count", {}),
            "views": pg_info.get("view_count", {}),
            "foreign_tables": pg_info.get("foreign_table_count", {}),
            "connections": pg_info.get("connection_count", {}),
            "cache_hit_ratio": pg_info.get("cache_hit_ratio", {}),
        },
        "mysql": {
            "version": mysql_info.get("version", {}),
            "size": mysql_info.get("db_size", {}),
            "tables": mysql_info.get("table_count", {}),
            "connections": mysql_info.get("connection_count", {}),
        },
        "mssql": {
            "tables": mssql_info.get("total_foreign_tables", 0),
            "status": "connected" if mssql_info.get("ecriture_comptable", {}).get("row_count", 0) > 0 else "error",
        }
    }

@router.post("/query")
async def executer_requete(
    database: str = Query(..., description="postgresql ou mysql"),
    query: str = Body(..., embed=True),
    limit: int = Body(100, embed=True),
    pg_session: AsyncSession = Depends(get_pg_session),
    mysql_session: AsyncSession = Depends(get_mysql_session)
):
    if database == "postgresql":
        return await database_service.executer_requete(pg_session, database, query, limit)
    elif database == "mysql":
        return await database_service.executer_requete(mysql_session, database, query, limit)
    else:
        raise HTTPException(status_code=400, detail="Base de donnees non supportee")

@router.post("/refresh-views")
async def refresh_materialized_views(session: AsyncSession = Depends(get_pg_session)):
    return await database_service.refresh_all_mat_views(session)
