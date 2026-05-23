from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_pg_session
from app.services import employe_service
from app.schemas.employe import EmployeList, BulletinPaieList
from typing import Optional
import logging

router = APIRouter(prefix="/api/employes", tags=["Employes & Paie"])

@router.get("", response_model=EmployeList)
async def lister_employes(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    id_agence: Optional[int] = None,
    poste: Optional[str] = None,
    search: Optional[str] = None,
    session: AsyncSession = Depends(get_pg_session)
):
    return await employe_service.obtenir_employes(session, page, page_size, id_agence, poste, search)

@router.get("/", response_model=EmployeList)
async def lister_employes_slash(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    id_agence: Optional[int] = None,
    poste: Optional[str] = None,
    search: Optional[str] = None,
    session: AsyncSession = Depends(get_pg_session)
):
    return await employe_service.obtenir_employes(session, page, page_size, id_agence, poste, search)

@router.get("/paie")
async def lister_bulletins_paie(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    id_employe: Optional[int] = None,
    mois: Optional[int] = None,
    annee: Optional[int] = None,
    id_agence: Optional[int] = None,
    session: AsyncSession = Depends(get_pg_session)
):
    return await employe_service.obtenir_bulletins_paie(session, page, page_size, id_employe, mois, annee, id_agence)

@router.get("/paie/")
async def lister_bulletins_paie_slash(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    id_employe: Optional[int] = None,
    mois: Optional[int] = None,
    annee: Optional[int] = None,
    id_agence: Optional[int] = None,
    session: AsyncSession = Depends(get_pg_session)
):
    return await employe_service.obtenir_bulletins_paie(session, page, page_size, id_employe, mois, annee, id_agence)

@router.get("/paie/stats")
async def stats_paie(session: AsyncSession = Depends(get_pg_session)):
    return await employe_service.obtenir_stats_paie(session)

@router.get("/paie/stats/")
async def stats_paie_slash(session: AsyncSession = Depends(get_pg_session)):
    return await employe_service.obtenir_stats_paie(session)
