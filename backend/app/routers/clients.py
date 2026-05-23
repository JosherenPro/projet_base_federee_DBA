from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional
import logging

from app.database import get_pg_session
from app.schemas.client import ClientCreate, ClientComplet, ClientList
from app.services import federation_service
from app.utils.icf_generator import generer_icf
from app.exceptions import ClientNotFoundException

router = APIRouter(prefix="/api/clients", tags=["Clients"])
logger = logging.getLogger(__name__)

@router.get("", response_model=ClientList, description="Liste des clients avec profil complet et score de risque")
async def list_clients(
    page: int = Query(1, ge=1, description="Numero de page"),
    page_size: int = Query(20, ge=1, le=100, description="Taille de page"),
    search: Optional[str] = Query(None, description="Recherche par nom/prenom"),
    niveau_risque: Optional[str] = Query(None, description="Filtre par niveau de risque"),
    agence_ville: Optional[str] = Query(None, description="Filtre par ville d'agence"),
    session: AsyncSession = Depends(get_pg_session)
):
    result = await federation_service.obtenir_clients(
        session, page, page_size, search, niveau_risque, agence_ville
    )
    return result

@router.get("/{icf}", response_model=ClientComplet, description="Detail d'un client par ICF")
async def get_client_by_icf(
    icf: str,
    session: AsyncSession = Depends(get_pg_session)
):
    client = await federation_service.obtenir_client_complet(session, icf)
    if not client:
        raise ClientNotFoundException(icf)
    return client

@router.post("", response_model=ClientComplet, description="Creation d'un nouveau client", status_code=201)
async def create_client(
    client_data: ClientCreate,
    session: AsyncSession = Depends(get_pg_session)
):
    icf = generer_icf(client_data.numero_piece)

    query = text("""
        INSERT INTO client (nom, prenom, date_naissance, numero_piece, icf, telephone, email, adresse, id_agence)
        VALUES (:nom, :prenom, :date_naissance, :numero_piece, :icf, :telephone, :email, :adresse, :id_agence)
        RETURNING *
    """)
    result = await session.execute(query, {
        "nom": client_data.nom,
        "prenom": client_data.prenom,
        "date_naissance": client_data.date_naissance,
        "numero_piece": client_data.numero_piece,
        "icf": icf,
        "telephone": client_data.telephone,
        "email": client_data.email,
        "adresse": client_data.adresse,
        "id_agence": client_data.id_agence
    })
    row = result.mappings().first()

    client_complet = await federation_service.obtenir_client_complet(session, icf)
    if not client_complet:
        raise HTTPException(status_code=500, detail="Erreur lors de la creation du client")
    return client_complet
