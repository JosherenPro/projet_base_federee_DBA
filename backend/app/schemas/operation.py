from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional, List
from enum import Enum

class TypeOperation(str, Enum):
    virement = "virement"
    retrait = "retrait"
    depot = "depot"
    prelevement = "prelevement"

class TransactionCreate(BaseModel):
    type_operation: TypeOperation = Field(..., description="Type d'operation")
    montant: float = Field(..., gt=0, description="Montant en XOF")
    devise: str = Field(default="XOF", description="Devise (XOF, EUR, USD)")
    id_compte_source: Optional[int] = Field(None, description="ID compte source")
    id_compte_dest: Optional[int] = Field(None, description="ID compte destination")

class OperationComptable(BaseModel):
    id_transaction: int
    type_operation: str
    montant: float
    devise: str
    date_heure: datetime
    type_compte_source: Optional[str]
    type_compte_dest: Optional[str]
    id_ecriture: Optional[int]
    date_ecriture: Optional[date]
    libelle_ecriture: Optional[str]
    debit: Optional[float]
    credit: Optional[float]
    journal: Optional[str]
    numero_compte: Optional[str]
    libelle_compte: Optional[str]
    classe_compte: Optional[int]

    class Config:
        from_attributes = True

class OperationList(BaseModel):
    total: int
    page: int
    page_size: int
    operations: List[OperationComptable]
