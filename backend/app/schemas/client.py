from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional, List
from enum import Enum

class NiveauRisque(str, Enum):
    faible = "faible"
    moyen = "moyen"
    eleve = "eleve"
    tres_eleve = "tres_eleve"

class ClientCreate(BaseModel):
    nom: str = Field(..., min_length=2, max_length=100, description="Nom du client")
    prenom: str = Field(..., min_length=2, max_length=100, description="Prenom du client")
    date_naissance: date = Field(..., description="Date de naissance (AAAA-MM-JJ)")
    numero_piece: str = Field(..., min_length=5, max_length=50, description="Numero de piece d'identite")
    telephone: Optional[str] = Field(None, max_length=20, description="Numero de telephone")
    email: Optional[str] = Field(None, max_length=150, description="Adresse email")
    adresse: Optional[str] = Field(None, max_length=255, description="Adresse physique")
    id_agence: int = Field(..., description="Identifiant de l'agence")

class ClientComplet(BaseModel):
    id_client: int
    nom: str
    prenom: str
    date_naissance: date
    icf: str
    telephone: Optional[str]
    email: Optional[str]
    adresse: Optional[str]
    agence_nom: str
    agence_ville: str
    nombre_comptes: int
    solde_total: float
    solde_courant: float
    solde_epargne: float
    score_risque: Optional[int] = Field(None, description="Score de risque (0-100)")
    niveau_risque: Optional[NiveauRisque] = Field(None, description="Niveau de risque")
    date_dernier_scoring: Optional[datetime]

    class Config:
        from_attributes = True

class ClientList(BaseModel):
    total: int
    page: int
    page_size: int
    clients: List[ClientComplet]
