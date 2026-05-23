from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional, List
from datetime import date
import logging

from app.database import get_pg_session, get_mysql_session
from app.schemas.credit import CreditCreate, CreditDetail, CreditList, GarantieCreate, ScoringCreate
from app.services import federation_service
from app.exceptions import CreditNotFoundException

router = APIRouter(prefix="/api/credits", tags=["Credits"])
logger = logging.getLogger(__name__)

@router.get("", response_model=CreditList, description="Liste des dossiers de credit")
async def list_credits(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    statut: Optional[str] = Query(None, description="Filtre par statut"),
    session: AsyncSession = Depends(get_pg_session)
):
    where_clauses = []
    params = {}

    if statut:
        where_clauses.append("statut_credit = :statut")
        params["statut"] = statut

    where_sql = " AND ".join(where_clauses) if where_clauses else "TRUE"

    count_query = text(f"SELECT COUNT(*) as total FROM vue_credit_detail WHERE {where_sql}")
    count_result = await session.execute(count_query, params)
    total = count_result.mappings().first()["total"]

    offset = (page - 1) * page_size
    params["limit"] = page_size
    params["offset"] = offset

    data_query = text(f"""
        SELECT * FROM vue_credit_detail WHERE {where_sql}
        ORDER BY date_soumission DESC LIMIT :limit OFFSET :offset
    """)
    result = await session.execute(data_query, params)
    credits = [dict(row) for row in result.mappings().all()]

    return {"total": total, "page": page, "page_size": page_size, "credits": credits}

@router.get("/{id_dossier}", response_model=CreditDetail, description="Detail d'un dossier de credit")
async def get_credit_by_id(
    id_dossier: int,
    session: AsyncSession = Depends(get_pg_session)
):
    query = text("SELECT * FROM vue_credit_detail WHERE id_dossier = :id_dossier")
    result = await session.execute(query, {"id_dossier": id_dossier})
    row = result.mappings().first()
    if not row:
        raise CreditNotFoundException(id_dossier)
    return dict(row)

@router.get("/{id_dossier}/echeancier", description="Echeancier d'un dossier de credit")
async def get_echeancier(
    id_dossier: int,
    session: AsyncSession = Depends(get_pg_session)
):
    query = text("""
        SELECT * FROM fdw_echeancier WHERE id_dossier = :id_dossier
        ORDER BY date_echeance ASC
    """)
    result = await session.execute(query, {"id_dossier": id_dossier})
    echeances = [dict(row) for row in result.mappings().all()]
    return {"id_dossier": id_dossier, "echeances": echeances}

@router.put("/{id_dossier}/echeancier/{id_echeance}/statut", description="Mettre a jour le statut d'une echeance")
async def update_echeance_statut(
    id_dossier: int,
    id_echeance: int,
    statut: str = Query(..., description="paid, overdue, pending"),
    mysql_session: AsyncSession = Depends(get_mysql_session)
):
    query = text("""
        UPDATE echeancier SET statut_paiement = :statut, date_paiement_effectif = :date_paiement
        WHERE id_echeance = :id_echeance AND id_dossier = :id_dossier
    """)
    date_paiement = date.today().isoformat() if statut == "paid" else None
    result = await mysql_session.execute(query, {
        "statut": statut,
        "date_paiement": date_paiement,
        "id_echeance": id_echeance,
        "id_dossier": id_dossier
    })
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Echeance non trouvee")
    return {"message": "Statut echeance mis a jour", "id_echeance": id_echeance, "nouveau_statut": statut}

@router.put("/{id_dossier}/decision", description="Approuver ou rejeter un dossier de credit")
async def update_credit_decision(
    id_dossier: int,
    statut: str = Query(..., description="approuve, rejete"),
    montant_accorde: Optional[float] = Query(None, description="Montant accorde (si different du montant demande)"),
    motif_rejet: Optional[str] = Query(None, description="Motif de rejet"),
    mysql_session: AsyncSession = Depends(get_mysql_session)
):
    if statut not in ["approuve", "rejete"]:
        raise HTTPException(status_code=400, detail="Statut invalide. Utilisez 'approuve' ou 'rejete'")

    query = text("""
        UPDATE dossier_credit
        SET statut = :statut,
            date_decision = NOW(),
            montant_accorde = COALESCE(:montant_accorde, montant_demande),
            motif_rejet = :motif_rejet
        WHERE id_dossier = :id_dossier
    """)
    result = await mysql_session.execute(query, {
        "statut": statut,
        "montant_accorde": montant_accorde,
        "motif_rejet": motif_rejet,
        "id_dossier": id_dossier
    })
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Dossier non trouve")
    return {"message": f"Dossier {statut} avec succes", "id_dossier": id_dossier, "statut": statut}

@router.post("", response_model=CreditDetail, description="Creation d'un nouveau dossier de credit", status_code=201)
async def create_credit(
    credit_data: CreditCreate,
    mysql_session: AsyncSession = Depends(get_mysql_session)
):
    query = text("""
        INSERT INTO dossier_credit (montant_demande, duree_mois, taux, icf, id_agent)
        VALUES (:montant_demande, :duree_mois, :taux, :icf, :id_agent)
    """)
    await mysql_session.execute(query, {
        "montant_demande": credit_data.montant_demande,
        "duree_mois": credit_data.duree_mois,
        "taux": credit_data.taux,
        "icf": credit_data.icf,
        "id_agent": credit_data.id_agent
    })

    pg_query = text("SELECT * FROM vue_credit_detail ORDER BY id_dossier DESC LIMIT 1")
    pg_result = await mysql_session.execute(pg_query)
    row = pg_result.mappings().first()
    return dict(row) if row else {}

@router.post("/{id_dossier}/garanties", description="Ajout d'une garantie a un dossier", status_code=201)
async def add_garantie(
    id_dossier: int,
    garantie_data: GarantieCreate,
    mysql_session: AsyncSession = Depends(get_mysql_session)
):
    query = text("""
        INSERT INTO garantie (type_garantie, valeur_estimee, description, id_dossier, date_evaluation)
        VALUES (:type_garantie, :valeur_estimee, :description, :id_dossier, :date_evaluation)
    """)
    await mysql_session.execute(query, {
        "type_garantie": garantie_data.type_garantie,
        "valeur_estimee": garantie_data.valeur_estimee,
        "description": garantie_data.description,
        "id_dossier": id_dossier,
        "date_evaluation": garantie_data.date_evaluation
    })
    return {"message": "Garantie ajoutee avec succes"}

@router.post("/{id_dossier}/scoring", description="Ajout d'un scoring a un dossier", status_code=201)
async def add_scoring(
    id_dossier: int,
    scoring_data: ScoringCreate,
    mysql_session: AsyncSession = Depends(get_mysql_session)
):
    credit_query = text("SELECT icf FROM dossier_credit WHERE id_dossier = :id_dossier")
    credit_result = await mysql_session.execute(credit_query, {"id_dossier": id_dossier})
    credit_row = credit_result.mappings().first()
    if not credit_row:
        raise CreditNotFoundException(id_dossier)

    scoring_query = text("""
        INSERT INTO scoring (score, icf, commentaire)
        VALUES (:score, :icf, :commentaire)
    """)
    await mysql_session.execute(scoring_query, {
        "score": scoring_data.score,
        "icf": credit_row["icf"],
        "commentaire": scoring_data.commentaire
    })
    return {"message": "Scoring ajoute avec succes"}
