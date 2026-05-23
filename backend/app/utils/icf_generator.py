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
