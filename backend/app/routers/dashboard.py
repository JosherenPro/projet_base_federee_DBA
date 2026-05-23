from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import logging

from app.database import get_pg_session
from app.schemas.dashboard import DashboardGlobal, IndicateurAgence, ClientRisque
from app.services import federation_service

router = APIRouter(prefix="/api/dashboard", tags=["Tableau de Bord"])
logger = logging.getLogger(__name__)

@router.get("", response_model=DashboardGlobal, description="Indicateurs cles par agence")
async def get_dashboard(session: AsyncSession = Depends(get_pg_session)):
    result = await federation_service.obtenir_tableau_bord(session)
    return result

@router.get("/agence/{id_agence}", response_model=IndicateurAgence, description="Indicateurs d'une agence specifique")
async def get_dashboard_agence(
    id_agence: int,
    session: AsyncSession = Depends(get_pg_session)
):
    query = text("SELECT * FROM vue_tableau_bord WHERE id_agence = :id_agence")
    result = await session.execute(query, {"id_agence": id_agence})
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail=f"Agence {id_agence} non trouvee")
    return dict(row)

@router.get("/risque", description="Liste des clients a risque eleve")
async def get_clients_risque_eleve(session: AsyncSession = Depends(get_pg_session)):
    clients = await federation_service.obtenir_clients_risque_eleve(session)
    return clients

@router.post("/refresh", description="Rafraichir les vues materialisees")
async def refresh_materialized_views(session: AsyncSession = Depends(get_pg_session)):
    await session.execute(text("SELECT rafraichir_vues_materialisees()"))
    return {"message": "Vues materialisees rafraichies avec succes"}
