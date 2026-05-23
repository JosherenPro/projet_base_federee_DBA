from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ReconciliationICF(BaseModel):
    icf: str
    present_postgres: bool
    present_mysql: bool
    present_mssql: bool
    coherent: bool
    client_nom: Optional[str] = None

class Incoherence(BaseModel):
    type: str
    description: str
    icf: Optional[str] = None
    source: str
    severite: str

class RapportReconciliation(BaseModel):
    date_verification: datetime
    total_clients_pg: int
    total_clients_mysql: int
    icf_communs: int
    icf_uniquement_pg: int
    icf_uniquement_mysql: int
    incoherences_detectees: int
    incoherences: List[Incoherence]
    clients_incoherents: List[ReconciliationICF]
    statut: str
