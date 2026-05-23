from pydantic import BaseModel, Field
from typing import Optional, List

class IndicateurAgence(BaseModel):
    id_agence: int
    agence_nom: str
    agence_ville: str
    code_agence: str
    nombre_comptes_actifs: int
    solde_total_comptes: float
    nombre_credits_approuves: int
    volume_total_credits: float
    nombre_credits_en_cours: int
    nombre_operations_agence: int
    volume_operations: float

class ClientRisque(BaseModel):
    id_client: int
    nom: str
    prenom: str
    icf: str
    telephone: Optional[str]
    email: Optional[str]
    agence_nom: str
    score: int
    niveau_risque: str
    date_evaluation: str

class DashboardGlobal(BaseModel):
    indicateurs_par_agence: List[IndicateurAgence]
    total_comptes_actifs: int
    solde_total_global: float
    total_credits_approuves: int
    volume_total_credits: float
    nombre_agences: int
