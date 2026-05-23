from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional, List, Dict, Any
import logging

logger = logging.getLogger(__name__)

async def obtenir_comptes(
    session: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    type_compte: Optional[str] = None,
    statut: Optional[str] = None,
    id_agence: Optional[int] = None,
    search: Optional[str] = None
) -> Dict[str, Any]:
    where_clauses = []
    params: Dict[str, Any] = {}

    if type_compte:
        where_clauses.append("c.type_compte = :type_compte")
        params["type_compte"] = type_compte

    if statut:
        where_clauses.append("c.statut = :statut")
        params["statut"] = statut

    if id_agence:
        where_clauses.append("c.id_agence = :id_agence")
        params["id_agence"] = id_agence

    if search:
        where_clauses.append("(cl.nom ILIKE :search OR cl.prenom ILIKE :search OR c.iban ILIKE :search)")
        params["search"] = f"%{search}%"

    where_sql = " AND ".join(where_clauses) if where_clauses else "TRUE"

    count_query = text(f"""
        SELECT COUNT(*) as total FROM compte c
        JOIN client cl ON c.id_client = cl.id_client
        WHERE {where_sql}
    """)
    count_result = await session.execute(count_query, params)
    total = count_result.mappings().first()["total"]

    offset = (page - 1) * page_size
    params["limit"] = page_size
    params["offset"] = offset

    data_query = text(f"""
        SELECT
            c.id_compte, c.iban, c.type_compte, c.solde, c.date_ouverture, c.statut,
            c.id_client, c.id_agence,
            cl.nom AS client_nom, cl.prenom AS client_prenom,
            a.nom AS agence_nom
        FROM compte c
        JOIN client cl ON c.id_client = cl.id_client
        JOIN agence a ON c.id_agence = a.id_agence
        WHERE {where_sql}
        ORDER BY c.date_ouverture DESC LIMIT :limit OFFSET :offset
    """)
    result = await session.execute(data_query, params)
    comptes = [dict(row) for row in result.mappings().all()]

    return {"total": total, "page": page, "page_size": page_size, "comptes": comptes}

async def obtenir_compte_par_id(session: AsyncSession, id_compte: int) -> Optional[Dict[str, Any]]:
    query = text("""
        SELECT
            c.id_compte, c.iban, c.type_compte, c.solde, c.date_ouverture, c.statut,
            c.id_client, c.id_agence,
            cl.nom AS client_nom, cl.prenom AS client_prenom, cl.icf,
            a.nom AS agence_nom, a.ville AS agence_ville
        FROM compte c
        JOIN client cl ON c.id_client = cl.id_client
        JOIN agence a ON c.id_agence = a.id_agence
        WHERE c.id_compte = :id_compte
    """)
    result = await session.execute(query, {"id_compte": id_compte})
    row = result.mappings().first()
    return dict(row) if row else None

async def creer_compte(session: AsyncSession, compte_data: Dict[str, Any]) -> Dict[str, Any]:
    import random
    iban = f"TG58{random.randint(10000, 99999)}{random.randint(1000000000, 9999999999)}"
    
    query = text("""
        INSERT INTO compte (iban, type_compte, solde, date_ouverture, statut, id_client, id_agence)
        VALUES (:iban, :type_compte, :solde, NOW(), 'actif', :id_client, :id_agence)
        RETURNING id_compte, iban, type_compte, solde, date_ouverture, statut, id_client, id_agence
    """)
    result = await session.execute(query, {
        "iban": iban,
        "type_compte": compte_data["type_compte"],
        "solde": compte_data.get("solde_initial", 0.0),
        "id_client": compte_data["id_client"],
        "id_agence": compte_data["id_agence"]
    })
    row = result.mappings().first()
    return dict(row)

async def update_compte_statut(session: AsyncSession, id_compte: int, statut: str) -> Optional[Dict[str, Any]]:
    query = text("""
        UPDATE compte SET statut = :statut WHERE id_compte = :id_compte
        RETURNING id_compte, iban, type_compte, solde, date_ouverture, statut, id_client, id_agence
    """)
    result = await session.execute(query, {"id_compte": id_compte, "statut": statut})
    row = result.mappings().first()
    return dict(row) if row else None

async def obtenir_historique_transactions(
    session: AsyncSession,
    id_compte: int,
    page: int = 1,
    page_size: int = 20,
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None
) -> Dict[str, Any]:
    where_clauses = ["(t.id_compte_source = :id_compte OR t.id_compte_dest = :id_compte)"]
    params: Dict[str, Any] = {"id_compte": id_compte}

    if date_debut:
        where_clauses.append("t.date_heure >= :date_debut")
        params["date_debut"] = date_debut

    if date_fin:
        where_clauses.append("t.date_heure <= :date_fin")
        params["date_fin"] = date_fin

    where_sql = " AND ".join(where_clauses)

    count_query = text(f"SELECT COUNT(*) as total FROM transaction t WHERE {where_sql}")
    count_result = await session.execute(count_query, params)
    total = count_result.mappings().first()["total"]

    offset = (page - 1) * page_size
    params["limit"] = page_size
    params["offset"] = offset

    data_query = text(f"""
        SELECT
            t.id_transaction, t.type_operation, t.montant, t.devise, t.date_heure,
            t.id_compte_source, t.id_compte_dest,
            CASE WHEN t.id_compte_source = :id_compte THEN 'debit' ELSE 'credit' END AS sens
        FROM transaction t
        WHERE {where_sql}
        ORDER BY t.date_heure DESC LIMIT :limit OFFSET :offset
    """)
    result = await session.execute(data_query, params)
    transactions = [dict(row) for row in result.mappings().all()]

    return {"total": total, "page": page, "page_size": page_size, "transactions": transactions}

async def obtenir_stats_comptes(session: AsyncSession) -> Dict[str, Any]:
    query = text("""
        SELECT
            COUNT(*) as total_comptes,
            COUNT(*) FILTER (WHERE statut = 'actif') as comptes_actifs,
            COUNT(*) FILTER (WHERE statut = 'bloque') as comptes_bloques,
            COUNT(*) FILTER (WHERE type_compte = 'courant') as comptes_courants,
            COUNT(*) FILTER (WHERE type_compte = 'epargne') as comptes_epargne,
            COUNT(*) FILTER (WHERE type_compte = 'terme') as comptes_terme,
            SUM(solde) FILTER (WHERE statut = 'actif') as solde_total,
            AVG(solde) FILTER (WHERE statut = 'actif') as solde_moyen
        FROM compte
    """)
    result = await session.execute(query)
    row = result.mappings().first()
    return dict(row)
