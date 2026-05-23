from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Dict, Any, List, Optional
import logging
import re

logger = logging.getLogger(__name__)

async def obtenir_info_postgres(session: AsyncSession) -> Dict[str, Any]:
    queries = {
        "version": "SELECT version() as version",
        "db_size": "SELECT pg_database_size(current_database()) as size_bytes, pg_size_pretty(pg_database_size(current_database())) as size_pretty",
        "table_count": "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'",
        "view_count": "SELECT COUNT(*) as count FROM information_schema.views WHERE table_schema = 'public'",
        "foreign_table_count": "SELECT COUNT(*) as count FROM pg_foreign_table ft JOIN pg_class c ON ft.ftrelid = c.oid",
        "connection_count": "SELECT COUNT(*) as count FROM pg_stat_activity WHERE datname = current_database()",
        "uptime": "SELECT EXTRACT(EPOCH FROM (NOW() - pg_postmaster_start_time())) as uptime_seconds",
        "cache_hit_ratio": "SELECT ROUND(SUM(heap_blks_hit) / NULLIF(SUM(heap_blks_hit) + SUM(heap_blks_read), 0) * 100, 2) as ratio FROM pg_statio_user_tables",
    }

    results = {}
    for key, query in queries.items():
        try:
            result = await session.execute(text(query))
            row = result.mappings().first()
            if row:
                results[key] = dict(row)
        except Exception as e:
            results[key] = {"error": str(e)}

    tables_query = text("""
        SELECT
            schemaname, relname as table_name,
            n_live_tup as row_count,
            pg_size_pretty(pg_total_relation_size(schemaname || '.' || relname)) as total_size,
            last_vacuum, last_analyze
        FROM pg_stat_user_tables
        ORDER BY pg_total_relation_size(schemaname || '.' || relname) DESC
        LIMIT 20
    """)
    result = await session.execute(tables_query)
    results["tables"] = [dict(r) for r in result.mappings().all()]

    views_query = text("""
        SELECT viewname, definition FROM pg_views WHERE schemaname = 'public' ORDER BY viewname
    """)
    result = await session.execute(views_query)
    results["views"] = [dict(r) for r in result.mappings().all()]

    mat_views_query = text("""
        SELECT matviewname, ispopulated FROM pg_matviews WHERE schemaname = 'public'
    """)
    result = await session.execute(mat_views_query)
    results["materialized_views"] = [dict(r) for r in result.mappings().all()]

    fdw_query = text("""
        SELECT
            fs.srvname as server_name, fs.srvoptions,
            COUNT(ft.ftrelid) as foreign_tables
        FROM pg_foreign_server fs
        LEFT JOIN pg_foreign_table ft ON fs.oid = (SELECT srvoptions FROM pg_foreign_server WHERE oid = (SELECT ftserver FROM pg_foreign_table WHERE ftrelid = ft.ftrelid))
        GROUP BY fs.srvname, fs.srvoptions
    """)
    try:
        result = await session.execute(text("""
            SELECT fs.srvname as server_name, COUNT(ft.ftrelid) as foreign_tables
            FROM pg_foreign_server fs
            LEFT JOIN pg_foreign_table ft ON fs.oid = (
                SELECT srvoptions FROM pg_foreign_server fs2 WHERE fs2.srvname = fs.srvname LIMIT 1
            )
            GROUP BY fs.srvname
        """))
        results["fdw_servers"] = [dict(r) for r in result.mappings().all()]
    except:
        results["fdw_servers"] = []

    return results

async def obtenir_info_mysql(mysql_session: AsyncSession) -> Dict[str, Any]:
    queries = {
        "version": "SELECT VERSION() as version",
        "db_size": """
            SELECT
                SUM(data_length + index_length) as size_bytes,
                ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as size_mb
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
        """,
        "table_count": "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'",
        "connection_count": "SELECT COUNT(*) as count FROM information_schema.processlist WHERE db = DATABASE()",
        "uptime": "SHOW STATUS LIKE 'Uptime'",
    }

    results = {}
    for key, query in queries.items():
        try:
            result = await mysql_session.execute(text(query))
            if key == "uptime":
                rows = result.mappings().all()
                for r in rows:
                    if r.get("Variable_name") == "Uptime":
                        results[key] = {"uptime_seconds": int(r.get("Value", 0))}
                        break
            else:
                row = result.mappings().first()
                if row:
                    results[key] = dict(row)
        except Exception as e:
            results[key] = {"error": str(e)}

    tables_query = text("""
        SELECT
            table_name, engine, table_rows as row_count,
            ROUND((data_length + index_length) / 1024 / 1024, 2) as size_mb,
            create_time, update_time
        FROM information_schema.tables
        WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'
        ORDER BY (data_length + index_length) DESC
    """)
    result = await mysql_session.execute(tables_query)
    results["tables"] = [dict(r) for r in result.mappings().all()]

    triggers_query = text("""
        SELECT trigger_name, event_manipulation, event_object_table, action_timing
        FROM information_schema.triggers
        WHERE trigger_schema = DATABASE()
    """)
    result = await mysql_session.execute(triggers_query)
    results["triggers"] = [dict(r) for r in result.mappings().all()]

    return results

async def obtenir_info_mssql_via_fdw(session: AsyncSession) -> Dict[str, Any]:
    results = {}

    try:
        result = await session.execute(text("SELECT COUNT(*) as count FROM fdw_ecriture_comptable"))
        results["ecriture_comptable"] = {"row_count": result.mappings().first()["count"]}
    except:
        results["ecriture_comptable"] = {"row_count": 0, "status": "error"}

    try:
        result = await session.execute(text("SELECT COUNT(*) as count FROM fdw_plan_comptable"))
        results["plan_comptable"] = {"row_count": result.mappings().first()["count"]}
    except:
        results["plan_comptable"] = {"row_count": 0, "status": "error"}

    try:
        result = await session.execute(text("SELECT COUNT(*) as count FROM fdw_bulletin_paie"))
        results["bulletin_paie"] = {"row_count": result.mappings().first()["count"]}
    except:
        results["bulletin_paie"] = {"row_count": 0, "status": "error"}

    try:
        result = await session.execute(text("SELECT COUNT(*) as count FROM fdw_operation_agence"))
        results["operation_agence"] = {"row_count": result.mappings().first()["count"]}
    except:
        results["operation_agence"] = {"row_count": 0, "status": "error"}

    results["total_foreign_tables"] = 4

    return results

async def executer_requete(session: AsyncSession, database: str, query: str, limit: int = 100) -> Dict[str, Any]:
    try:
        safe_query = query.strip().rstrip(";")
        forbidden = ["insert", "update", "delete", "drop", "alter", "create", "truncate", "grant", "revoke"]
        first_word = safe_query.lower().split()[0] if safe_query else ""
        if first_word in forbidden:
            return {"error": "Seules les requetes SELECT sont autorisees en mode lecture"}

        has_limit = bool(re.search(r'\bLIMIT\b', safe_query, re.IGNORECASE))
        if not has_limit:
            safe_query = f"{safe_query} LIMIT {min(limit, 1000)}"

        result = await session.execute(text(safe_query))
        rows = result.mappings().all()
        columns = list(rows[0].keys()) if rows else []
        return {
            "columns": columns,
            "rows": [dict(r) for r in rows],
            "count": len(rows)
        }
    except Exception as e:
        return {"error": str(e)}

async def refresh_all_mat_views(session: AsyncSession) -> Dict[str, Any]:
    result = await session.execute(text("""
        SELECT matviewname FROM pg_matviews WHERE schemaname = 'public'
    """))
    views = [r["matviewname"] for r in result.mappings().all()]

    refreshed = []
    errors = []
    for view in views:
        try:
            await session.execute(text(f"REFRESH MATERIALIZED VIEW CONCURRENTLY {view}"))
            refreshed.append(view)
        except Exception as e:
            try:
                await session.execute(text(f"REFRESH MATERIALIZED VIEW {view}"))
                refreshed.append(view)
            except Exception as e2:
                errors.append({"view": view, "error": str(e2)})

    return {"refreshed": refreshed, "errors": errors}
