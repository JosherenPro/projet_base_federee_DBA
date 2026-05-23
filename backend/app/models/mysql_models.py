from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, Text, Enum as SAEnum
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.sql import func
import enum

class MySQLBase(DeclarativeBase):
    pass

class StatutCredit(str, enum.Enum):
    en_cours = "en_cours"
    approuve = "approuve"
    rejete = "rejete"
    cloture = "cloture"

class TypeGarantie(str, enum.Enum):
    nantissement = "nantissement"
    caution = "caution"
    hypotheque = "hypotheque"
    depot_gage = "depot_gage"
    autre = "autre"

class StatutPaiement(str, enum.Enum):
    pending = "pending"
    paid = "paid"
    overdue = "overdue"

class NiveauRisque(str, enum.Enum):
    faible = "faible"
    moyen = "moyen"
    eleve = "eleve"
    tres_eleve = "tres_eleve"

class DossierCredit(MySQLBase):
    __tablename__ = "dossier_credit"
    id_dossier = Column(Integer, primary_key=True, autoincrement=True)
    montant_demande = Column(Numeric(15, 2), nullable=False)
    montant_accorde = Column(Numeric(15, 2), nullable=True)
    duree_mois = Column(Integer, nullable=False)
    taux = Column(Numeric(5, 2), nullable=False)
    statut = Column(SAEnum(StatutCredit), nullable=False, default=StatutCredit.en_cours)
    icf = Column(String(64), nullable=False)
    id_agent = Column(Integer, nullable=True)
    date_soumission = Column(DateTime, nullable=False, server_default=func.now())
    date_decision = Column(DateTime, nullable=True)
    motif_rejet = Column(Text, nullable=True)

class Garantie(MySQLBase):
    __tablename__ = "garantie"
    id_garantie = Column(Integer, primary_key=True, autoincrement=True)
    type_garantie = Column(SAEnum(TypeGarantie), nullable=False)
    valeur_estimee = Column(Numeric(15, 2), nullable=False)
    description = Column(Text, nullable=True)
    id_dossier = Column(Integer, nullable=False)
    date_evaluation = Column(Date, nullable=True)

class Echeancier(MySQLBase):
    __tablename__ = "echeancier"
    id_echeance = Column(Integer, primary_key=True, autoincrement=True)
    date_echeance = Column(Date, nullable=False)
    montant_capital = Column(Numeric(15, 2), nullable=False)
    montant_interet = Column(Numeric(15, 2), nullable=False)
    statut_paiement = Column(SAEnum(StatutPaiement), nullable=False, default=StatutPaiement.pending)
    date_paiement_effectif = Column(Date, nullable=True)
    id_dossier = Column(Integer, nullable=False)

class Scoring(MySQLBase):
    __tablename__ = "scoring"
    id_scoring = Column(Integer, primary_key=True, autoincrement=True)
    score = Column(Integer, nullable=False)
    niveau_risque = Column(SAEnum(NiveauRisque), nullable=False)
    date_evaluation = Column(DateTime, nullable=False, server_default=func.now())
    icf = Column(String(64), nullable=False)
    commentaire = Column(Text, nullable=True)
