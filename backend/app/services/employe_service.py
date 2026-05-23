from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional, List, Dict, Any
import logging

logger = logging.getLogger(__name__)

async def obtenir_employes(
    session: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    id_agence: Optional[int] = None,
    poste: Optional[str] = None,
    search: Optional[str] = None
) -> Dict[str, Any]:
    where_clauses = []
    params: Dict[str, Any] = {}

    if id_agence:
        where_clauses.append("e.id_agence = :id_agence")
        params["id_agence"] = id_agence

    if poste:
        where_clauses.append("e.poste ILIKE :poste")
        params["poste"] = f"%{poste}%"

    if search:
        where_clauses.append("(e.nom ILIKE :search OR e.prenom ILIKE :search)")
        params["search"] = f"%{search}%"

    where_sql = " AND ".join(where_clauses) if where_clauses else "TRUE"

    count_query = text(f"SELECT COUNT(*) as total FROM employe e WHERE {where_sql}")
    count_result = await session.execute(count_query, params)
    total = count_result.mappings().first()["total"]

    offset = (page - 1) * page_size
    params["limit"] = page_size
    params["offset"] = offset

    data_query = text(f"""
        SELECT e.id_employe, e.nom, e.prenom, e.poste, e.id_agence, e.date_embauche,
               a.nom AS agence_nom
        FROM employe e
        JOIN agence a ON e.id_agence = a.id_agence
        WHERE {where_sql}
        ORDER BY e.nom, e.prenom LIMIT :limit OFFSET :offset
    """)
    result = await session.execute(data_query, params)
    employes = [dict(row) for row in result.mappings().all()]

    return {"total": total, "page": page, "page_size": page_size, "employes": employes}

async def obtenir_bulletins_paie(
    session: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    id_employe: Optional[int] = None,
    mois: Optional[int] = None,
    annee: Optional[int] = None,
    id_agence: Optional[int] = None
) -> Dict[str, Any]:
    where_clauses = []
    params: Dict[str, Any] = {}

    if id_employe:
        where_clauses.append("bp.id_employe = :id_employe")
        params["id_employe"] = id_employe

    if mois:
        where_clauses.append("bp.mois = :mois")
        params["mois"] = mois

    if annee:
        where_clauses.append("bp.annee = :annee")
        params["annee"] = annee

    if id_agence:
        where_clauses.append("bp.id_agence = :id_agence")
        params["id_agence"] = id_agence

    where_sql = " AND ".join(where_clauses) if where_clauses else "TRUE"

    count_query = text(f"""
        SELECT COUNT(*) as total FROM fdw_bulletin_paie bp WHERE {where_sql}
    """)
    count_result = await session.execute(count_query, params)
    total = count_result.mappings().first()["total"]

    offset = (page - 1) * page_size
    params["limit"] = page_size
    params["offset"] = offset

    data_query = text(f"""
        SELECT bp.id_bulletin, bp.mois, bp.annee, bp.salaire_brut, bp.salaire_net,
               bp.net_a_payer, bp.id_employe, bp.id_agence, bp.date_emission,
               e.nom AS employe_nom, e.prenom AS employe_prenom
        FROM fdw_bulletin_paie bp
        LEFT JOIN employe e ON bp.id_employe = e.id_employe
        WHERE {where_sql}
        ORDER BY bp.annee DESC, bp.mois DESC LIMIT :limit OFFSET :offset
    """)
    result = await session.execute(data_query, params)
    bulletins = [dict(row) for row in result.mappings().all()]

    return {"total": total, "page": page, "page_size": page_size, "bulletins": bulletins}

async def obtenir_stats_paie(session: AsyncSession) -> Dict[str, Any]:
    query = text("""
        SELECT
            COUNT(*) as total_bulletins,
            SUM(salaire_brut) as masse_salariale_brute,
            SUM(net_a_payer) as masse_salariale_net,
            AVG(salaire_net) as salaire_moyen,
            MIN(salaire_net) as salaire_min,
            MAX(salaire_net) as salaire_max
        FROM fdw_bulletin_paie
    """)
    result = await session.execute(query)
    row = result.mappings().first()
    return dict(row)
