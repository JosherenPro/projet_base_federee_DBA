from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_pg_session
from app.services import reconciliation_service
from app.schemas.reconciliation import RapportReconciliation
import logging

router = APIRouter(prefix="/api/reconciliation", tags=["Reconciliation"])
logger = logging.getLogger(__name__)

@router.get("/rapport")
async def rapport_reconciliation(session: AsyncSession = Depends(get_pg_session)):
    rapport = await reconciliation_service.verifier_coherence_icf(session)
    return rapport

@router.get("/comptes-credits")
async def coherence_comptes_credits(session: AsyncSession = Depends(get_pg_session)):
    return await reconciliation_service.verifier_coherence_comptes_credits(session)

@router.get("/doublons-icf")
async def doublons_icf(session: AsyncSession = Depends(get_pg_session)):
    return await reconciliation_service.verifier_doublons_icf(session)

@router.post("/refresh")
async def refresh_reconciliation(session: AsyncSession = Depends(get_pg_session)):
    rapport = await reconciliation_service.verifier_coherence_icf(session)
    coherence = await reconciliation_service.verifier_coherence_comptes_credits(session)
    doublons = await reconciliation_service.verifier_doublons_icf(session)
    return {
        "coherence_icf": rapport,
        "coherence_comptes_credits": coherence,
        "doublons_icf": doublons
    }
