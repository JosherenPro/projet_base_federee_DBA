from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey, CheckConstraint, Enum as SAEnum
from sqlalchemy.orm import relationship, DeclarativeBase
from sqlalchemy.sql import func
import enum

class Base(DeclarativeBase):
    pass

class TypeCompte(str, enum.Enum):
    courant = "courant"
    epargne = "epargne"
    terme = "terme"

class StatutCompte(str, enum.Enum):
    actif = "actif"
    cloture = "cloture"
    suspendu = "suspendu"

class TypeOperation(str, enum.Enum):
    virement = "virement"
    retrait = "retrait"
    depot = "depot"
    prelevement = "prelevement"

class Agence(Base):
    __tablename__ = "agence"
    id_agence = Column(Integer, primary_key=True, autoincrement=True)
    nom = Column(String(150), nullable=False)
    ville = Column(String(100), nullable=False)
    adresse = Column(String(255))
    code_agence = Column(String(10), nullable=False, unique=True)

    employes = relationship("Employe", back_populates="agence")
    clients = relationship("Client", back_populates="agence")
    comptes = relationship("Compte", back_populates="agence")

class Employe(Base):
    __tablename__ = "employe"
    id_employe = Column(Integer, primary_key=True, autoincrement=True)
    nom = Column(String(100), nullable=False)
    prenom = Column(String(100), nullable=False)
    poste = Column(String(100), nullable=False)
    id_agence = Column(Integer, ForeignKey("agence.id_agence"), nullable=False)
    date_embauche = Column(Date, nullable=False, server_default=func.current_date())

    agence = relationship("Agence", back_populates="employes")

class Client(Base):
    __tablename__ = "client"
    id_client = Column(Integer, primary_key=True, autoincrement=True)
    nom = Column(String(100), nullable=False)
    prenom = Column(String(100), nullable=False)
    date_naissance = Column(Date, nullable=False)
    numero_piece = Column(String(50), nullable=False, unique=True)
    icf = Column(String(64), nullable=False, unique=True)
    telephone = Column(String(20))
    email = Column(String(150))
    adresse = Column(String(255))
    id_agence = Column(Integer, ForeignKey("agence.id_agence"), nullable=False)
    date_creation = Column(DateTime, nullable=False, server_default=func.now())

    agence = relationship("Agence", back_populates="clients")
    comptes = relationship("Compte", back_populates="client")

class Compte(Base):
    __tablename__ = "compte"
    id_compte = Column(Integer, primary_key=True, autoincrement=True)
    iban = Column(String(34), nullable=False, unique=True)
    type_compte = Column(SAEnum(TypeCompte), nullable=False)
    solde = Column(Numeric(15, 2), nullable=False, default=0.00)
    date_ouverture = Column(Date, nullable=False, server_default=func.current_date())
    statut = Column(SAEnum(StatutCompte), nullable=False, default=StatutCompte.actif)
    id_client = Column(Integer, ForeignKey("client.id_client"), nullable=False)
    id_agence = Column(Integer, ForeignKey("agence.id_agence"), nullable=False)

    client = relationship("Client", back_populates="comptes")
    agence = relationship("Agence", back_populates="comptes")

class Transaction(Base):
    __tablename__ = "transaction"
    id_transaction = Column(Integer, primary_key=True, autoincrement=True)
    type_operation = Column(SAEnum(TypeOperation), nullable=False)
    montant = Column(Numeric(15, 2), nullable=False)
    devise = Column(String(3), nullable=False, default="XOF")
    date_heure = Column(DateTime, nullable=False, server_default=func.now())
    id_compte_source = Column(Integer, ForeignKey("compte.id_compte"), nullable=True)
    id_compte_dest = Column(Integer, ForeignKey("compte.id_compte"), nullable=True)
