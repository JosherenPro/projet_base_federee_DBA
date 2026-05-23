from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional
import logging

from app.database import get_pg_session
from app.schemas.operation import TransactionCreate, OperationComptable, OperationList
from app.services import federation_service

router = APIRouter(prefix="/api/operations", tags=["Operations"])
logger = logging.getLogger(__name__)

@router.get("", response_model=OperationList, description="Operations comptables avec ecritures")
async def list_operations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    date_debut: Optional[str] = Query(None, description="Date debut (AAAA-MM-JJ)"),
    date_fin: Optional[str] = Query(None, description="Date fin (AAAA-MM-JJ)"),
    type_operation: Optional[str] = Query(None, description="Type d'operation"),
    session: AsyncSession = Depends(get_pg_session)
):
    result = await federation_service.obtenir_operations_comptables(
        session, page, page_size, date_debut, date_fin, type_operation
    )
    return result

@router.post("/transactions", description="Creation d'une transaction", status_code=201)
async def create_transaction(
    transaction_data: TransactionCreate,
    session: AsyncSession = Depends(get_pg_session)
):
    query = text("""
        INSERT INTO transaction (type_operation, montant, devise, id_compte_source, id_compte_dest)
        VALUES (:type_operation, :montant, :devise, :id_compte_source, :id_compte_dest)
        RETURNING *
    """)
    result = await session.execute(query, {
        "type_operation": transaction_data.type_operation.value,
        "montant": transaction_data.montant,
        "devise": transaction_data.devise,
        "id_compte_source": transaction_data.id_compte_source,
        "id_compte_dest": transaction_data.id_compte_dest
    })
    row = result.mappings().first()
    return dict(row)
