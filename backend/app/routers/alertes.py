from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_pg_session
from app.services import alerte_service
from app.schemas.alerte import AlerteList, ResumeAlertes
from typing import Optional
import logging

router = APIRouter(prefix="/api/alertes", tags=["Alertes & Notifications"])
logger = logging.getLogger(__name__)

@router.get("/")
async def lister_alertes(
    type_alerte: Optional[str] = Query(None, description="solde_bas, echeance_retard, transaction_suspecte"),
    session: AsyncSession = Depends(get_pg_session)
):
    alertes = []
    
    if type_alerte in [None, "solde_bas"]:
        solde_alertes = await alerte_service.obtenir_alertes_solde_bas(session)
        for a in solde_alertes:
            alertes.append({
                "type": "solde_bas",
                "severite": "critique" if a["solde"] < 10000 else "avertissement",
                "message": f"Compte {a['client_nom']} {a['client_prenom']}: solde {a['solde']:,.0f} XOF",
                "reference_id": a["id_compte"],
                "details": a
            })
    
    if type_alerte in [None, "echeance_retard"]:
        retard_alertes = await alerte_service.obtenir_alertes_echeances_retard(session)
        for a in retard_alertes:
            alertes.append({
                "type": "echeance_retard",
                "severite": "critique" if a.get("jours_retard", 0) > 30 else "avertissement",
                "message": f"Echeance en retard de {a.get('jours_retard', 0)} jours - {a['client_nom']}",
                "reference_id": a["id_echeance"],
                "details": a
            })
    
    if type_alerte in [None, "transaction_suspecte"]:
        suspect_alertes = await alerte_service.obtenir_alertes_transactions_suspectes(session)
        for a in suspect_alertes:
            alertes.append({
                "type": "transaction_suspecte",
                "severite": "critique",
                "message": f"{a['motif']}: {a['montant']:,.0f} XOF",
                "reference_id": a["id_transaction"],
                "details": a
            })
    
    return {"total": len(alertes), "alertes": alertes}

@router.get("/resume")
async def resume_alertes(session: AsyncSession = Depends(get_pg_session)):
    return await alerte_service.obtenir_resume_alertes(session)

@router.get("/solde-bas")
async def alertes_solde_bas(
    seuil: float = Query(50000, description="Seuil d'alerte en XOF"),
    session: AsyncSession = Depends(get_pg_session)
):
    return await alerte_service.obtenir_alertes_solde_bas(session, seuil)

@router.get("/echeances-retard")
async def alertes_echeances_retard(session: AsyncSession = Depends(get_pg_session)):
    return await alerte_service.obtenir_alertes_echeances_retard(session)

@router.get("/transactions-suspectes")
async def alertes_transactions_suspectes(
    seuil: float = Query(5000000, description="Seuil de suspicion en XOF"),
    session: AsyncSession = Depends(get_pg_session)
):
    return await alerte_service.obtenir_alertes_transactions_suspectes(session, seuil)
