#!/bin/bash
# Script de verification complete du systeme federe

echo "=== 1. Verification des conteneurs Docker ==="
docker compose ps

echo ""
echo "=== 2. Verification de PostgreSQL ==="
docker exec postgres-hub pg_isready -U banque_admin -d banque_hub

echo ""
echo "=== 3. Verification des extensions FDW ==="
docker exec postgres-hub psql -U banque_admin -d banque_hub -c "SELECT extname, extversion FROM pg_extension WHERE extname IN ('mysql_fdw', 'tds_fdw');"

echo ""
echo "=== 4. Verification des foreign tables ==="
docker exec postgres-hub psql -U banque_admin -d banque_hub -c "SELECT COUNT(*) FROM fdw_dossier_credit;" 2>/dev/null || echo "Foreign tables MySQL non accessibles"
docker exec postgres-hub psql -U banque_admin -d banque_hub -c "SELECT COUNT(*) FROM fdw_ecriture_comptable;" 2>/dev/null || echo "Foreign tables MSSQL non accessibles"

echo ""
echo "=== 5. Verification des vues federees ==="
docker exec postgres-hub psql -U banque_admin -d banque_hub -c "SELECT COUNT(*) FROM vue_client_complet;"
docker exec postgres-hub psql -U banque_admin -d banque_hub -c "SELECT COUNT(*) FROM vue_credit_detail;"
docker exec postgres-hub psql -U banque_admin -d banque_hub -c "SELECT COUNT(*) FROM vue_operation_comptable;"
docker exec postgres-hub psql -U banque_admin -d banque_hub -c "SELECT COUNT(*) FROM vue_tableau_bord;"

echo ""
echo "=== 6. Verification de MySQL ==="
docker exec mysql-credit mysqladmin ping -h localhost -u credit_user -pCr3ditT0g0! 2>/dev/null || echo "MySQL non accessible"

echo ""
echo "=== 7. Verification de SQL Server ==="
docker exec mssql-compta /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "C0mptaT0g0!2025" -C -Q "SELECT name FROM sys.databases" 2>/dev/null || echo "SQL Server non accessible"

echo ""
echo "=== 8. Verification du backend FastAPI ==="
curl -s http://localhost:8000/api/health | python3 -m json.tool 2>/dev/null || echo "Backend non accessible"

echo ""
echo "=== 9. Verification des endpoints API ==="
curl -s http://localhost:8000/api/clients?page_size=5 | python3 -m json.tool 2>/dev/null || echo "Endpoint clients non accessible"
curl -s http://localhost:8000/api/dashboard | python3 -m json.tool 2>/dev/null || echo "Endpoint dashboard non accessible"

echo ""
echo "=== 10. Verification du frontend ==="
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
echo "Frontend HTTP Status: $HTTP_CODE"

echo ""
echo "=== Verification terminee ==="
