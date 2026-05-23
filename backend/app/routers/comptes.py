from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_pg_session
from app.services import compte_service
from app.schemas.compte import CompteCreate, CompteUpdate, CompteDetail, CompteList, TransactionHistorique
from typing import Optional
import logging

router = APIRouter(prefix="/api/comptes", tags=["Comptes"])
logger = logging.getLogger(__name__)

@router.get("/")
async def lister_comptes(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    type_compte: Optional[str] = None,
    statut: Optional[str] = None,
    id_agence: Optional[int] = None,
    search: Optional[str] = None,
    session: AsyncSession = Depends(get_pg_session)
):
    return await compte_service.obtenir_comptes(session, page, page_size, type_compte, statut, id_agence, search)

@router.get("/stats")
async def stats_comptes(session: AsyncSession = Depends(get_pg_session)):
    return await compte_service.obtenir_stats_comptes(session)

@router.get("/{id_compte}")
async def obtenir_compte(id_compte: int, session: AsyncSession = Depends(get_pg_session)):
    compte = await compte_service.obtenir_compte_par_id(session, id_compte)
    if not compte:
        raise HTTPException(status_code=404, detail="Compte non trouve")
    return compte

@router.post("/")
async def creer_compte(compte_data: CompteCreate, session: AsyncSession = Depends(get_pg_session)):
    try:
        result = await compte_service.creer_compte(session, compte_data.dict())
        return result
    except Exception as e:
        logger.error(f"Erreur creation compte: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur creation compte: {str(e)}")

@router.put("/{id_compte}/statut")
async def update_statut(id_compte: int, update_data: CompteUpdate, session: AsyncSession = Depends(get_pg_session)):
    if not update_data.statut:
        raise HTTPException(status_code=400, detail="Statut requis")
    result = await compte_service.update_compte_statut(session, id_compte, update_data.statut)
    if not result:
        raise HTTPException(status_code=404, detail="Compte non trouve")
    return result

@router.get("/{id_compte}/transactions")
async def historique_transactions(
    id_compte: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    date_debut: Optional[str] = None,
    date_fin: Optional[str] = None,
    session: AsyncSession = Depends(get_pg_session)
):
    return await compte_service.obtenir_historique_transactions(session, id_compte, page, page_size, date_debut, date_fin)
