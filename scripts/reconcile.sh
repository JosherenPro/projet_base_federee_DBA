#!/bin/bash
# Script de reconciliation des donnees entre les bases

echo "=== Rapport de reconciliation ==="
echo ""

echo "--- Clients PostgreSQL ---"
docker exec postgres-hub psql -U banque_admin -d banque_hub -c "SELECT COUNT(*) as total_clients FROM client;"

echo ""
echo "--- Scorings MySQL ---"
docker exec postgres-hub psql -U banque_admin -d banque_hub -c "SELECT COUNT(*) as total_scorings FROM fdw_scoring;"

echo ""
echo "--- Clients sans scoring ---"
docker exec postgres-hub psql -U banque_admin -d banque_hub -c "
SELECT c.icf, c.nom, c.prenom
FROM client c
LEFT JOIN fdw_scoring s ON c.icf = s.icf
WHERE s.icf IS NULL;"

echo ""
echo "--- Ecritures comptables SQL Server ---"
docker exec postgres-hub psql -U banque_admin -d banque_hub -c "SELECT COUNT(*) as total_ecritures FROM fdw_ecriture_comptable;"

echo ""
echo "--- Bulletins de paie SQL Server ---"
docker exec postgres-hub psql -U banque_admin -d banque_hub -c "SELECT COUNT(*) as total_bulletins FROM fdw_bulletin_paie;"

echo ""
echo "=== Rapport termine ==="
