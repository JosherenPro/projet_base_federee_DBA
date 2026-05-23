from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class CompteCreate(BaseModel):
    type_compte: str = Field(..., description="courant, epargne, ou terme")
    id_client: int
    id_agence: int
    solde_initial: float = Field(default=0.0, ge=0)
    devise: str = Field(default="XOF")

class CompteUpdate(BaseModel):
    statut: Optional[str] = None
    solde: Optional[float] = None

class CompteDetail(BaseModel):
    id_compte: int
    iban: str
    type_compte: str
    solde: float
    date_ouverture: datetime
    statut: str
    id_client: int
    id_agence: int
    client_nom: Optional[str] = None
    client_prenom: Optional[str] = None
    agence_nom: Optional[str] = None

class CompteList(BaseModel):
    total: int
    page: int
    page_size: int
    comptes: List[CompteDetail]

class TransactionHistorique(BaseModel):
    id_transaction: int
    type_operation: str
    montant: float
    devise: str
    date_heure: datetime
    id_compte_source: Optional[int]
    id_compte_dest: Optional[int]
