from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class EmployeDetail(BaseModel):
    id_employe: int
    nom: str
    prenom: str
    poste: str
    id_agence: int
    date_embauche: datetime
    agence_nom: Optional[str] = None

class EmployeList(BaseModel):
    total: int
    page: int
    page_size: int
    employes: List[EmployeDetail]

class BulletinPaie(BaseModel):
    id_bulletin: int
    mois: int
    annee: int
    salaire_brut: float
    salaire_net: float
    net_a_payer: float
    id_employe: int
    id_agence: int
    date_emission: datetime
    employe_nom: Optional[str] = None
    employe_prenom: Optional[str] = None

class BulletinPaieList(BaseModel):
    total: int
    page: int
    page_size: int
    bulletins: List[BulletinPaie]
