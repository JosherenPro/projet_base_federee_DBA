from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List, Dict, Any
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

async def verifier_coherence_icf(session: AsyncSession) -> Dict[str, Any]:
    pg_query = text("SELECT icf, nom, prenom FROM client")
    pg_result = await session.execute(pg_query)
    pg_clients = {row["icf"]: {"nom": row["nom"], "prenom": row["prenom"]} for row in pg_result.mappings().all()}

    mysql_query = text("SELECT DISTINCT icf FROM fdw_scoring")
    try:
        mysql_result = await session.execute(mysql_query)
        mysql_icfs = {row["icf"] for row in mysql_result.mappings().all()}
    except Exception as e:
        logger.error(f"Erreur MySQL: {e}")
        mysql_icfs = set()

    mssql_query = text("SELECT DISTINCT icf FROM fdw_dossier_credit WHERE icf IS NOT NULL")
    try:
        mssql_result = await session.execute(mssql_query)
        mssql_icfs = {row["icf"] for row in mssql_result.mappings().all()}
    except Exception as e:
        logger.error(f"Erreur MSSQL: {e}")
        mssql_icfs = set()

    all_icfs = set(pg_clients.keys()) | mysql_icfs | mssql_icfs
    icf_communs = set(pg_clients.keys()) & mysql_icfs & mssql_icfs

    incoherences = []
    clients_incoherents = []

    for icf in all_icfs:
        present_pg = icf in pg_clients
        present_mysql = icf in mysql_icfs
        present_mssql = icf in mssql_icfs

        coherent = present_pg and (present_mysql or present_mssql)

        if not coherent:
            if present_pg and not present_mysql and not present_mssql:
                incoherences.append({
                    "type": "client_orphelin",
                    "description": f"Client {pg_clients[icf]['nom']} {pg_clients[icf]['prenom']} present dans PostgreSQL mais absent des autres bases",
                    "icf": icf[:16] + "...",
                    "source": "postgresql",
                    "severite": "avertissement"
                })
            if present_mysql and not present_pg:
                incoherences.append({
                    "type": "scoring_sans_client",
                    "description": f"Scoring present dans MySQL pour ICF {icf[:16]}... mais client absent de PostgreSQL",
                    "icf": icf[:16] + "...",
                    "source": "mysql",
                    "severite": "erreur"
                })
            if present_mssql and not present_pg:
                incoherences.append({
                    "type": "credit_sans_client",
                    "description": f"Credit present dans SQL Server pour ICF {icf[:16]}... mais client absent de PostgreSQL",
                    "icf": icf[:16] + "...",
                    "source": "mssql",
                    "severite": "erreur"
                })

        clients_incoherents.append({
            "icf": icf[:16] + "...",
            "present_postgres": present_pg,
            "present_mysql": present_mysql,
            "present_mssql": present_mssql,
            "coherent": coherent,
            "client_nom": pg_clients.get(icf, {}).get("nom"),
            "client_prenom": pg_clients.get(icf, {}).get("prenom")
        })

    statut = "coherent" if len(incoherences) == 0 else "incoherences_detectees"

    return {
        "date_verification": datetime.now().isoformat(),
        "total_clients_pg": len(pg_clients),
        "total_clients_mysql": len(mysql_icfs),
        "icf_communs": len(icf_communs),
        "icf_uniquement_pg": len(set(pg_clients.keys()) - mysql_icfs - mssql_icfs),
        "icf_uniquement_mysql": len(mysql_icfs - set(pg_clients.keys())),
        "incoherences_detectees": len(incoherences),
        "incoherences": incoherences,
        "clients_incoherents": [c for c in clients_incoherents if not c["coherent"]],
        "statut": statut
    }

async def verifier_coherence_comptes_credits(session: AsyncSession) -> Dict[str, Any]:
    query = text("""
        SELECT
            dc.id_dossier, dc.montant_accorde, dc.statut,
            cl.nom, cl.prenom,
            COUNT(c.id_compte) as nb_comptes,
            SUM(c.solde) as solde_total
        FROM fdw_dossier_credit dc
        JOIN client cl ON dc.icf = cl.icf
        LEFT JOIN compte c ON cl.id_client = c.id_client AND c.statut = 'actif'
        WHERE dc.statut = 'en_cours'
        GROUP BY dc.id_dossier, dc.montant_accorde, dc.statut, cl.nom, cl.prenom
        HAVING SUM(c.solde) < dc.montant_accorde * 0.1
    """)
    result = await session.execute(query)
    credits_sous_garantis = [dict(row) for row in result.mappings().all()]

    return {
        "credits_sous_garantis": credits_sous_garantis,
        "total": len(credits_sous_garantis)
    }

async def verifier_doublons_icf(session: AsyncSession) -> Dict[str, Any]:
    query = text("""
        SELECT icf, COUNT(*) as nb, STRING_AGG(nom || ' ' || prenom, ', ') as noms
        FROM client
        GROUP BY icf
        HAVING COUNT(*) > 1
    """)
    result = await session.execute(query)
    doublons = [dict(row) for row in result.mappings().all()]

    return {"doublons": doublons, "total": len(doublons)}
