from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional, List
from enum import Enum

class StatutCredit(str, Enum):
    en_cours = "en_cours"
    approuve = "approuve"
    rejete = "rejete"
    cloture = "cloture"

class CreditCreate(BaseModel):
    montant_demande: float = Field(..., gt=0, description="Montant demande en XOF")
    duree_mois: int = Field(..., gt=0, description="Duree en mois")
    taux: float = Field(..., gt=0, le=100, description="Taux d'interet annuel")
    icf: str = Field(..., min_length=64, max_length=64, description="Identifiant Client Federe")
    id_agent: Optional[int] = Field(None, description="ID de l'agent gestionnaire")

class GarantieCreate(BaseModel):
    type_garantie: str = Field(..., description="Type de garantie")
    valeur_estimee: float = Field(..., gt=0, description="Valeur estimee en XOF")
    description: Optional[str] = Field(None, description="Description de la garantie")
    date_evaluation: Optional[date] = Field(None, description="Date d'evaluation")

class ScoringCreate(BaseModel):
    score: int = Field(..., ge=0, le=100, description="Score de risque (0-100)")
    commentaire: Optional[str] = Field(None, description="Commentaire sur le scoring")

class EcheancierDetail(BaseModel):
    id_echeance: int
    date_echeance: date
    montant_capital: float
    montant_interet: float
    statut_paiement: str
    date_paiement_effectif: Optional[date]

class CreditDetail(BaseModel):
    id_dossier: int
    montant_demande: float
    montant_accorde: Optional[float]
    duree_mois: int
    taux: float
    statut_credit: str
    date_soumission: datetime
    date_decision: Optional[datetime]
    motif_rejet: Optional[str]
    icf: str
    client_nom: Optional[str]
    client_prenom: Optional[str]
    agence_nom: Optional[str]
    agent_nom: Optional[str]
    agent_prenom: Optional[str]
    nombre_garanties: int
    valeur_totale_garanties: float
    nombre_echeances: int
    montant_total_restant: float
    nombre_echeances_impayees: int

    class Config:
        from_attributes = True

class CreditList(BaseModel):
    total: int
    page: int
    page_size: int
    credits: List[CreditDetail]
