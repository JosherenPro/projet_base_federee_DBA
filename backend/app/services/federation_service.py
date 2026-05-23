from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional, List, Dict, Any
import logging

logger = logging.getLogger(__name__)

async def obtenir_client_complet(session: AsyncSession, icf: str) -> Optional[Dict[str, Any]]:
    """Requete la vue federee et retourne le profil complet d'un client."""
    logger.info(f"Recherche client complet avec ICF: {icf[:8]}...")
    query = text("""
        SELECT * FROM vue_client_complet WHERE icf = :icf
    """)
    result = await session.execute(query, {"icf": icf})
    row = result.mappings().first()
    if row:
        logger.info(f"Client trouve: {row['nom']} {row['prenom']}")
        return dict(row)
    logger.warning(f"Client non trouve avec ICF: {icf[:8]}...")
    return None

async def obtenir_clients(
    session: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    niveau_risque: Optional[str] = None,
    agence_ville: Optional[str] = None
) -> Dict[str, Any]:
    """Liste des clients avec pagination et filtres."""
    where_clauses = []
    params: Dict[str, Any] = {}

    if search:
        where_clauses.append("(nom ILIKE :search OR prenom ILIKE :search)")
        params["search"] = f"%{search}%"

    if niveau_risque:
        where_clauses.append("niveau_risque = :niveau_risque")
        params["niveau_risque"] = niveau_risque

    if agence_ville:
        where_clauses.append("agence_ville = :agence_ville")
        params["agence_ville"] = agence_ville

    where_sql = " AND ".join(where_clauses) if where_clauses else "TRUE"

    count_query = text(f"""
        SELECT COUNT(*) as total FROM vue_client_complet WHERE {where_sql}
    """)
    count_result = await session.execute(count_query, params)
    total = count_result.mappings().first()["total"]

    offset = (page - 1) * page_size
    params["limit"] = page_size
    params["offset"] = offset

    data_query = text(f"""
        SELECT * FROM vue_client_complet WHERE {where_sql}
        ORDER BY nom, prenom LIMIT :limit OFFSET :offset
    """)
    result = await session.execute(data_query, params)
    clients = [dict(row) for row in result.mappings().all()]

    logger.info(f"Liste clients: page {page}, {len(clients)} resultats sur {total}")
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "clients": clients
    }

async def obtenir_credits_client(session: AsyncSession, icf: str) -> List[Dict[str, Any]]:
    """Liste les dossiers de credit d'un client."""
    logger.info(f"Recherche credits pour client ICF: {icf[:8]}...")
    query = text("""
        SELECT * FROM vue_credit_detail WHERE icf = :icf
    """)
    result = await session.execute(query, {"icf": icf})
    return [dict(row) for row in result.mappings().all()]

async def obtenir_operations_comptables(
    session: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    type_operation: Optional[str] = None,
    id_agence: Optional[int] = None
) -> Dict[str, Any]:
    """Operations avec ecritures comptables."""
    where_clauses = []
    params: Dict[str, Any] = {}

    if date_debut:
        where_clauses.append("date_heure >= :date_debut")
        params["date_debut"] = date_debut

    if date_fin:
        where_clauses.append("date_heure <= :date_fin")
        params["date_fin"] = date_fin

    if type_operation:
        where_clauses.append("type_operation = :type_operation")
        params["type_operation"] = type_operation

    where_sql = " AND ".join(where_clauses) if where_clauses else "TRUE"

    count_query = text(f"""
        SELECT COUNT(*) as total FROM vue_operation_comptable WHERE {where_sql}
    """)
    count_result = await session.execute(count_query, params)
    total = count_result.mappings().first()["total"]

    offset = (page - 1) * page_size
    params["limit"] = page_size
    params["offset"] = offset

    data_query = text(f"""
        SELECT * FROM vue_operation_comptable WHERE {where_sql}
        ORDER BY date_heure DESC LIMIT :limit OFFSET :offset
    """)
    result = await session.execute(data_query, params)
    operations = [dict(row) for row in result.mappings().all()]

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "operations": operations
    }

async def obtenir_tableau_bord(session: AsyncSession) -> Dict[str, Any]:
    """Indicateurs par agence."""
    logger.info("Calcul du tableau de bord...")
    query = text("SELECT * FROM vue_tableau_bord ORDER BY id_agence")
    result = await session.execute(query)
    agences = [dict(row) for row in result.mappings().all()]

    total_comptes = sum(a["nombre_comptes_actifs"] for a in agences)
    solde_total = float(sum(a["solde_total_comptes"] for a in agences))
    total_credits = sum(a["nombre_credits_approuves"] for a in agences)
    volume_credits = float(sum(a["volume_total_credits"] for a in agences))

    return {
        "indicateurs_par_agence": agences,
        "total_comptes_actifs": total_comptes,
        "solde_total_global": solde_total,
        "total_credits_approuves": total_credits,
        "volume_total_credits": volume_credits,
        "nombre_agences": len(agences)
    }

async def obtenir_clients_risque_eleve(session: AsyncSession) -> List[Dict[str, Any]]:
    """Liste des clients a risque eleve."""
    query = text("SELECT * FROM mv_clients_risque_eleve ORDER BY score ASC LIMIT 10")
    result = await session.execute(query)
    return [dict(row) for row in result.mappings().all()]

async def rechercher_clients(
    session: AsyncSession,
    search: str,
    niveau_risque: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Recherche multi-criteres de clients."""
    where_clauses = ["(nom ILIKE :search OR prenom ILIKE :search OR icf ILIKE :search)"]
    params: Dict[str, Any] = {"search": f"%{search}%"}

    if niveau_risque:
        where_clauses.append("niveau_risque = :niveau_risque")
        params["niveau_risque"] = niveau_risque

    where_sql = " AND ".join(where_clauses)
    query = text(f"""
        SELECT * FROM vue_client_complet WHERE {where_sql}
        ORDER BY nom, prenom LIMIT 50
    """)
    result = await session.execute(query, params)
    return [dict(row) for row in result.mappings().all()]
