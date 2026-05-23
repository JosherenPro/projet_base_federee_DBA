from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List, Dict, Any
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

SEUIL_SOLDE_BAS = 50000
SEUIL_TRANSACTION_SUSPECTE = 5000000

async def obtenir_alertes_solde_bas(session: AsyncSession, seuil: float = SEUIL_SOLDE_BAS) -> List[Dict[str, Any]]:
    query = text("""
        SELECT
            c.id_compte, c.solde, c.type_compte,
            cl.nom AS client_nom, cl.prenom AS client_prenom,
            a.nom AS agence_nom
        FROM compte c
        JOIN client cl ON c.id_client = cl.id_client
        JOIN agence a ON c.id_agence = a.id_agence
        WHERE c.statut = 'actif' AND c.solde < :seuil
        ORDER BY c.solde ASC
    """)
    result = await session.execute(query, {"seuil": seuil})
    return [dict(row) for row in result.mappings().all()]

async def obtenir_alertes_echeances_retard(session: AsyncSession) -> List[Dict[str, Any]]:
    query = text("""
        SELECT
            e.id_echeance, e.id_dossier, e.date_echeance, e.montant_capital, e.montant_interet,
            e.statut_paiement,
            cl.nom AS client_nom, cl.prenom AS client_prenom,
            EXTRACT(DAY FROM NOW() - e.date_echeance) AS jours_retard
        FROM fdw_echeancier e
        JOIN fdw_dossier_credit dc ON e.id_dossier = dc.id_dossier
        JOIN client cl ON dc.icf = cl.icf
        WHERE e.statut_paiement = 'overdue'
           OR (e.statut_paiement != 'paid' AND e.date_echeance < CURRENT_DATE)
        ORDER BY e.date_echeance ASC
    """)
    result = await session.execute(query)
    return [dict(row) for row in result.mappings().all()]

async def obtenir_alertes_transactions_suspectes(session: AsyncSession, seuil: float = SEUIL_TRANSACTION_SUSPECTE) -> List[Dict[str, Any]]:
    query = text("""
        SELECT
            t.id_transaction, t.type_operation, t.montant, t.date_heure,
            cl.nom AS client_nom, cl.prenom AS client_prenom,
            CASE
                WHEN t.montant > :seuil * 2 THEN 'Montant tres eleve'
                WHEN t.montant > :seuil THEN 'Montant eleve'
                WHEN t.type_operation = 'virement' AND t.montant > :seuil THEN 'Virement important'
                ELSE 'Transaction inhabituelle'
            END AS motif
        FROM transaction t
        JOIN compte c ON (t.id_compte_source = c.id_compte OR t.id_compte_dest = c.id_compte)
        JOIN client cl ON c.id_client = cl.id_client
        WHERE t.montant > :seuil
        ORDER BY t.date_heure DESC
        LIMIT 50
    """)
    result = await session.execute(query, {"seuil": seuil})
    return [dict(row) for row in result.mappings().all()]

async def obtenir_resume_alertes(session: AsyncSession) -> Dict[str, Any]:
    alertes_solde = await obtenir_alertes_solde_bas(session)
    alertes_retard = await obtenir_alertes_echeances_retard(session)
    alertes_suspectes = await obtenir_alertes_transactions_suspectes(session)

    total = len(alertes_solde) + len(alertes_retard) + len(alertes_suspectes)
    critiques = len([a for a in alertes_solde if a["solde"] < 10000]) + \
                len([a for a in alertes_retard if a.get("jours_retard", 0) > 30]) + \
                len([a for a in alertes_suspectes if "tres eleve" in a.get("motif", "").lower()])

    recentes = []
    for a in alertes_solde[:3]:
        recentes.append({
            "type": "solde_bas",
            "message": f"Compte {a['client_nom']} {a['client_prenom']}: solde {a['solde']:,.0f} XOF",
            "severite": "critique" if a["solde"] < 10000 else "avertissement"
        })
    for a in alertes_retard[:3]:
        recentes.append({
            "type": "echeance_retard",
            "message": f"Echeance en retard de {a.get('jours_retard', 0)} jours - {a['client_nom']}",
            "severite": "critique" if a.get("jours_retard", 0) > 30 else "avertissement"
        })
    for a in alertes_suspectes[:2]:
        recentes.append({
            "type": "transaction_suspecte",
            "message": f"{a['motif']}: {a['montant']:,.0f} XOF - {a['client_nom']}",
            "severite": "critique"
        })

    return {
        "total_alertes": total,
        "alertes_solde_bas": len(alertes_solde),
        "alertes_echeances_retard": len(alertes_retard),
        "alertes_transactions_suspectes": len(alertes_suspectes),
        "alertes_critiques": critiques,
        "alertes_recentes": recentes
    }
