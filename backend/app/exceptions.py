from fastapi import HTTPException

class FederationException(HTTPException):
    def __init__(self, detail: str):
        super().__init__(status_code=502, detail={
            "error_code": "FEDERATION_ERROR",
            "message": "Erreur de connexion a une base distante",
            "detail": detail
        })

class ClientNotFoundException(HTTPException):
    def __init__(self, icf: str):
        super().__init__(status_code=404, detail={
            "error_code": "CLIENT_NOT_FOUND",
            "message": "Client non trouve",
            "detail": f"Aucun client avec l'ICF {icf}"
        })

class CreditNotFoundException(HTTPException):
    def __init__(self, id_dossier: int):
        super().__init__(status_code=404, detail={
            "error_code": "CREDIT_NOT_FOUND",
            "message": "Dossier de credit non trouve",
            "detail": f"Aucun dossier avec l'ID {id_dossier}"
        })

class ReconciliationException(HTTPException):
    def __init__(self, detail: str):
        super().__init__(status_code=409, detail={
            "error_code": "RECONCILIATION_ERROR",
            "message": "Incoherence de donnees detectee",
            "detail": detail
        })

class ICFDuplicateException(HTTPException):
    def __init__(self, icf: str):
        super().__init__(status_code=409, detail={
            "error_code": "ICF_DUPLICATE",
            "message": "ICF deja existant",
            "detail": f"Un client avec l'ICF {icf} existe deja"
        })
