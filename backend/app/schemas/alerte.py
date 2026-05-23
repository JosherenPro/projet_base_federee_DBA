from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class Alerte(BaseModel):
    id: int
    type_alerte: str
    severite: str
    message: str
    date_creation: datetime
    reference_id: Optional[int] = None
    icf: Optional[str] = None

class AlerteList(BaseModel):
    total: int
    alertes: List[Alerte]

class AlerteSoldeBas(BaseModel):
    id_compte: int
    client_nom: str
    client_prenom: str
    solde: float
    seuil: float
    agence_nom: str

class AlerteEcheanceRetard(BaseModel):
    id_echeance: int
    id_dossier: int
    client_nom: str
    client_prenom: str
    date_echeance: datetime
    montant_capital: float
    montant_interet: float
    jours_retard: int

class AlerteTransactionSuspecte(BaseModel):
    id_transaction: int
    type_operation: str
    montant: float
    date_heure: datetime
    client_nom: Optional[str]
    client_prenom: Optional[str]
    motif: str

class ResumeAlertes(BaseModel):
    total_alertes: int
    alertes_solde_bas: int
    alertes_echeances_retard: int
    alertes_transactions_suspectes: int
    alertes_critiques: int
    alertes_recentes: List[dict]
