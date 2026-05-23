# PROMPT 04 - Backend FastAPI (API REST + Services)

## OBJECTIF

Implementer le backend FastAPI complet : application principale, connexion aux bases de donnees, modeles SQLAlchemy, schemas Pydantic, routers REST, services metier et utilitaires.

## PRE-REQUIS

Les prompts 01, 02 et 03 ont ete executes. Les bases de donnees sont configurees avec les FDW, foreign tables et vues federees fonctionnelles.

## STACK TECHNIQUE

- **Python 3.12**
- **FastAPI** (derniere version stable)
- **SQLAlchemy 2.0+** (modele asynchrone avec `AsyncSession`)
- **asyncpg** (pilote PostgreSQL asynchrone)
- **aiomysql** (pilote MySQL asynchrone)
- **Pydantic v2** (validation des donnees)
- **Uvicorn** (serveur ASGI)

---

## PARTIE A : Configuration et Initialisation

### Fichier : `backend/requirements.txt`

```
fastapi>=0.110.0
uvicorn[standard]>=0.27.0
sqlalchemy[asyncio]>=2.0.25
asyncpg>=0.29.0
aiomysql>=0.2.0
pydantic>=2.5.0
pydantic-settings>=2.1.0
python-dotenv>=1.0.0
httpx>=0.26.0
pytest>=7.4.0
pytest-asyncio>=0.23.0
```

### Fichier : `backend/app/config.py`

Configuration centralisee de l'application avec `pydantic-settings` :

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Configuration de l'application chargee depuis les variables d'environnement."""

    # Application
    APP_NAME: str = "Systeme de BDD Federees - Banque du Togo"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # PostgreSQL (hub central)
    POSTGRES_HOST: str = "postgres-hub"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "banque_hub"
    POSTGRES_USER: str = "banque_admin"
    POSTGRES_PASSWORD: str = "T0g0B4nque2025!"

    # MySQL (credits)
    MYSQL_HOST: str = "mysql-credit"
    MYSQL_PORT: int = 3306
    MYSQL_DB: str = "banque_credit"
    MYSQL_USER: str = "credit_user"
    MYSQL_PASSWORD: str = "Cr3ditT0g0!"

    # URLs de connexion completes
    @property
    def DATABASE_URL_POSTGRES(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @property
    def DATABASE_URL_MYSQL(self) -> str:
        return f"mysql+aiomysql://{self.MYSQL_USER}:{self.MYSQL_PASSWORD}@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DB}"

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

### Fichier : `backend/app/database.py`

Gestion des connexions asynchrones aux deux bases de donnees :

- Creer deux moteurs SQLAlchemy asynchrones : un pour PostgreSQL (hub central, qui donne acces aux vues federees), un pour MySQL (pour les operations d'ecriture directes sur les credits si necessaire).
- Creer deux `async_sessionmaker` pour gerer les sessions.
- Fournir des dependances FastAPI (`get_pg_session`, `get_mysql_session`) pour l'injection dans les routers.
- Gerer le cycle de vie des connexions (startup/shutdown events).

**IMPORTANT** : Le backend interroge principalement PostgreSQL et ses vues federees. Il n'accede directement aux bases esclaves que pour les operations d'ecriture specifiques (creation de dossier de credit dans MySQL par exemple).

### Fichier : `backend/app/main.py`

Application FastAPI principale :

- Inclure les 4 routers : clients, credits, operations, dashboard
- Configurer CORS middleware pour autoriser le frontend
- Ajouter un endpoint de healthcheck : `GET /api/health` qui verifie la connectivite aux 3 bases
- Ajouter un endpoint d'information sur la federation : `GET /api/federation/status` qui retourne l'etat des serveurs FDW
- Configurer les evenements de startup/shutdown pour la gestion des connexions
- Documenter l'API avec titre, description et version

---

## PARTIE B : Modeles SQLAlchemy

### Fichier : `backend/app/models/postgres_models.py`

Modeles ORM pour les tables PostgreSQL locales :

```python
from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey, CheckConstraint, UniqueConstraint, Enum
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
    type_compte = Column(Enum(TypeCompte), nullable=False)
    solde = Column(Numeric(15, 2), nullable=False, default=0.00)
    date_ouverture = Column(Date, nullable=False, server_default=func.current_date())
    statut = Column(Enum(StatutCompte), nullable=False, default=StatutCompte.actif)
    id_client = Column(Integer, ForeignKey("client.id_client"), nullable=False)
    id_agence = Column(Integer, ForeignKey("agence.id_agence"), nullable=False)

    client = relationship("Client", back_populates="comptes")
    agence = relationship("Agence", back_populates="comptes")

class Transaction(Base):
    __tablename__ = "transaction"
    id_transaction = Column(Integer, primary_key=True, autoincrement=True)
    type_operation = Column(Enum(TypeOperation), nullable=False)
    montant = Column(Numeric(15, 2), nullable=False)
    devise = Column(String(3), nullable=False, default="XOF")
    date_heure = Column(DateTime, nullable=False, server_default=func.now())
    id_compte_source = Column(Integer, ForeignKey("compte.id_compte"), nullable=True)
    id_compte_dest = Column(Integer, ForeignKey("compte.id_compte"), nullable=True)
```

### Fichier : `backend/app/models/mysql_models.py`

Modeles ORM pour les tables MySQL (pour les operations d'ecriture) :

- `DossierCredit`
- `Garantie`
- `Echeancier`
- `Scoring`

Avec les enums MySQL correspondants (statut, type_garantie, statut_paiement, niveau_risque).

### Fichier : `backend/app/models/mssql_models.py`

Modeles ORM pour les tables SQL Server (lecture seule via les vues federees) :

Pas de modeles directs. L'acces aux donnees SQL Server se fait exclusivement via les foreign tables et les vues federees dans PostgreSQL.

---

## PARTIE C : Schemas Pydantic

### Fichier : `backend/app/schemas/client.py`

Schemas de validation pour les clients :

```python
from pydantic import BaseModel, Field, EmailStr
from datetime import date, datetime
from typing import Optional
from enum import Enum

class NiveauRisque(str, Enum):
    faible = "faible"
    moyen = "moyen"
    eleve = "eleve"
    tres_eleve = "tres_eleve"

# Schema pour la creation d'un client
class ClientCreate(BaseModel):
    nom: str = Field(..., min_length=2, max_length=100, description="Nom du client")
    prenom: str = Field(..., min_length=2, max_length=100, description="Prenom du client")
    date_naissance: date = Field(..., description="Date de naissance (AAAA-MM-JJ)")
    numero_piece: str = Field(..., min_length=5, max_length=50, description="Numero de piece d'identite")
    telephone: Optional[str] = Field(None, max_length=20, description="Numero de telephone")
    email: Optional[str] = Field(None, max_length=150, description="Adresse email")
    adresse: Optional[str] = Field(None, max_length=255, description="Adresse physique")
    id_agence: int = Field(..., description="Identifiant de l'agence")

# Schema pour la reponse client complet (vue federee)
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

# Schema pour la liste paginee de clients
class ClientList(BaseModel):
    total: int
    page: int
    page_size: int
    clients: list[ClientComplet]
```

### Fichier : `backend/app/schemas/credit.py`

Schemas pour les credits :

- `CreditCreate` : creation d'un dossier de credit (montant_demande, duree_mois, taux, icf, id_agent)
- `CreditDetail` : detail complet d'un dossier (vue federee)
- `GarantieCreate`, `GarantieDetail`
- `EcheancierDetail`
- `ScoringCreate`, `ScoringDetail`
- `CreditList` : liste paginee

### Fichier : `backend/app/schemas/operation.py`

Schemas pour les operations comptables :

- `OperationComptable` : operation avec ecriture comptable associee (vue federee)
- `TransactionCreate` : creation d'une transaction
- `OperationList` : liste paginee

### Fichier : `backend/app/schemas/dashboard.py`

Schemas pour le tableau de bord :

```python
from pydantic import BaseModel
from typing import Optional

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

class DashboardGlobal(BaseModel):
    indicateurs_par_agence: list[IndicateurAgence]
    total_comptes_actifs: int
    solde_total_global: float
    total_credits_approuves: int
    volume_total_credits: float
    nombre_agences: int
```

---

## PARTIE D : Routers (Endpoints REST)

### Fichier : `backend/app/routers/clients.py`

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

router = APIRouter(prefix="/api/clients", tags=["Clients"])

# GET /api/clients - Liste des clients avec profil complet et score
# Parametres : page (default 1), page_size (default 20), search (recherche par nom/prenom),
#              niveau_risque (filtre par niveau de risque), agence_ville (filtre par ville)
# Requete la vue federee vue_client_complet
# Retourne ClientList (pagine)

# GET /api/clients/{icf} - Detail d'un client par ICF
# Requete la vue federee vue_client_complet avec filtre ICF
# Retourne ClientComplet
# 404 si client non trouve

# POST /api/clients - Creation d'un nouveau client
# Valide avec ClientCreate
# Insere dans la table locale client
# L'ICF est genere automatiquement par le trigger PostgreSQL
# Retourne le client cree avec son ICF genere
```

### Fichier : `backend/app/routers/credits.py`

```python
router = APIRouter(prefix="/api/credits", tags=["Credits"])

# GET /api/credits - Liste des dossiers de credit
# Parametres : page, page_size, statut (en_cours/approuve/rejete/cloture),
#              niveau_risque_client (faible/moyen/eleve/tres_eleve)
# Requete la vue federee vue_credit_detail
# Retourne CreditList (pagine)

# GET /api/credits/{id_dossier} - Detail d'un dossier de credit
# Requete la vue federee vue_credit_detail avec filtre id_dossier
# Retourne CreditDetail

# POST /api/credits - Creation d'un nouveau dossier de credit
# Valide avec CreditCreate
# Insere directement dans MySQL (table dossier_credit)
# Retourne le dossier cree

# POST /api/credits/{id_dossier}/garanties - Ajout d'une garantie
# POST /api/credits/{id_dossier}/scoring - Ajout d'un scoring
```

### Fichier : `backend/app/routers/operations.py`

```python
router = APIRouter(prefix="/api/operations", tags=["Operations"])

# GET /api/operations - Operations comptables avec ecritures
# Parametres : page, page_size, date_debut, date_fin, type_operation, id_agence
# Requete la vue federee vue_operation_comptable
# Retourne OperationList (pagine)

# POST /api/operations/transactions - Creation d'une transaction
# Valide avec TransactionCreate
# Insere dans la table locale transaction
# Retourne la transaction creee
```

### Fichier : `backend/app/routers/dashboard.py`

```python
router = APIRouter(prefix="/api/dashboard", tags=["Tableau de Bord"])

# GET /api/dashboard - Indicateurs cles par agence
# Requete la vue federee vue_tableau_bord
# Calcule les totaux globaux
# Retourne DashboardGlobal

# GET /api/dashboard/agence/{id_agence} - Indicateurs d'une agence specifique
# Retourne IndicateurAgence

# GET /api/dashboard/risque - Liste des clients a risque eleve
# Requete la vue materialisee mv_clients_risque_eleve
# Retourne la liste des clients a risque

# POST /api/dashboard/refresh - Rafraichir les vues materialisees
# Appelle la fonction rafraichir_vues_materialisees()
# Retourne un message de confirmation
```

---

## PARTIE E : Services Metier

### Fichier : `backend/app/services/federation_service.py`

Service qui encapsule la logique metier de la federation :

- `obtenir_client_complet(icf: str)` : requete la vue federee et retourne le profil complet
- `obtenir_credits_client(icf: str)` : liste les dossiers de credit d'un client
- `obtenir_operations_comptables(id_agence: int, date_debut, date_fin)` : operations avec ecritures
- `obtenir_tableau_bord()` : indicateurs par agence
- `rechercher_clients(search: str, niveau_risque: str)` : recherche multi-criteres

**IMPORTANT** : Toutes les requetes du service de federation doivent passer par PostgreSQL et ses vues federees. Ne jamais acceder directement aux bases esclaves pour les lectures.

### Fichier : `backend/app/services/reconciliation_service.py`

Service de reconciliation des donnees entre les bases :

- `verifier_coherence_icf(icf: str)` : verifie qu'un client existe dans les 3 bases
- `detecter_incoherences()` : compare les donnees entre les bases et signale les differences
- `reconcilier_client(icf: str)` : tente de reconcilier les donnees d'un client
- `rapport_reconciliation()` : genere un rapport de coherence global

### Fichier : `backend/app/utils/icf_generator.py`

Utilitaire de generation de l'ICF :

```python
import hashlib

def generer_icf(numero_piece: str, code_banque: str = "TOGO_BK001") -> str:
    """
    Genere l'Identifiant Client Federe (ICF) par hachage SHA-256.

    Args:
        numero_piece: Numero de piece d'identite du client
        code_banque: Code unique de la banque (par defaut: TOGO_BK001)

    Returns:
        ICF sous forme de chaine hexadecimale de 64 caracteres
    """
    donnees = f"{numero_piece}{code_banque}"
    return hashlib.sha256(donnees.encode('utf-8')).hexdigest()
```

---

## PARTIE F : Gestion des erreurs

### Fichier : `backend/app/exceptions.py`

Exceptions HTTP personnalisees :

- `ClientNotFoundException` : 404 - Client non trouve par ICF
- `CreditNotFoundException` : 404 - Dossier de credit non trouve
- `FederationException` : 502 - Erreur de connexion a une base distante
- `ReconciliationException` : 409 - Incoherence de donnees detectee
- `ICFDuplicateException` : 409 - ICF deja existant

Chaque exception doit retourner un JSON structure avec : `error_code`, `message`, `detail`.

## LIVRABLES ATTENDUS

- [ ] `backend/requirements.txt`
- [ ] `backend/app/__init__.py`
- [ ] `backend/app/main.py`
- [ ] `backend/app/config.py`
- [ ] `backend/app/database.py`
- [ ] `backend/app/models/postgres_models.py`
- [ ] `backend/app/models/mysql_models.py`
- [ ] `backend/app/models/__init__.py`
- [ ] `backend/app/schemas/client.py`
- [ ] `backend/app/schemas/credit.py`
- [ ] `backend/app/schemas/operation.py`
- [ ] `backend/app/schemas/dashboard.py`
- [ ] `backend/app/schemas/__init__.py`
- [ ] `backend/app/routers/clients.py`
- [ ] `backend/app/routers/credits.py`
- [ ] `backend/app/routers/operations.py`
- [ ] `backend/app/routers/dashboard.py`
- [ ] `backend/app/routers/__init__.py`
- [ ] `backend/app/services/federation_service.py`
- [ ] `backend/app/services/reconciliation_service.py`
- [ ] `backend/app/services/__init__.py`
- [ ] `backend/app/utils/icf_generator.py`
- [ ] `backend/app/utils/__init__.py`
- [ ] `backend/app/exceptions.py`
- [ ] `backend/Dockerfile`
- [ ] Verification : `uvicorn app.main:app` demarre sans erreur, Swagger accessible

## NOTES IMPORTANTES

- Utiliser `text()` de SQLAlchemy pour les requetes sur les vues federees, car les vues ne sont pas des modeles ORM classiques.
- Les sessions SQLAlchemy doivent etre asynchrones (`AsyncSession`) et utilisees avec `async with`.
- Chaque endpoint doit avoir : description, response_model, responses (pour les codes d'erreur), et des exemples.
- Les requetes sur les vues federees doivent utiliser des parametres lies (`:param`) pour eviter les injections SQL.
- Le healthcheck doit verifier la connectivite aux 3 bases de donnees (pas seulement PostgreSQL).
- Ajouter des logs pour chaque acces aux vues federees (niveau INFO) et pour chaque erreur de federation (niveau ERROR).
