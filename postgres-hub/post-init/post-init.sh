#!/bin/bash
# Script post-initialisation pour PostgreSQL Hub
# Attend que MySQL et SQL Server soient prets, puis configure les FDW et les vues

set -e

PG_USER="${POSTGRES_USER:-banque_admin}"
PG_DB="${POSTGRES_DB:-banque_hub}"
PG_PASSWORD="${POSTGRES_PASSWORD:-T0g0B4nque2025!}"

MYSQL_HOST="${MYSQL_HOST:-mysql-credit}"
MYSQL_PORT="${MYSQL_PORT:-3306}"

MSSQL_HOST="${MSSQL_HOST:-mssql-compta}"
MSSQL_PORT="${MSSQL_PORT:-1433}"

export PGPASSWORD="$PG_PASSWORD"

echo "=== Post-initialisation PostgreSQL Hub ==="

# Attendre que MySQL soit pret (test de connexion TCP)
echo "Attente de MySQL ($MYSQL_HOST:$MYSQL_PORT)..."
for i in {1..30}; do
    if python3 -c "
import socket
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.settimeout(2)
result = s.connect_ex(('$MYSQL_HOST', $MYSQL_PORT))
s.close()
exit(0 if result == 0 else 1)
" 2>/dev/null; then
        echo "MySQL est pret!"
        break
    fi
    echo "  En attente de MySQL... ($i/30)"
    sleep 2
done

# Attendre que SQL Server soit pret
echo "Attente de SQL Server ($MSSQL_HOST:$MSSQL_PORT)..."
for i in {1..30}; do
    if python3 -c "
import socket
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.settimeout(2)
result = s.connect_ex(('$MSSQL_HOST', $MSSQL_PORT))
s.close()
exit(0 if result == 0 else 1)
" 2>/dev/null; then
        echo "SQL Server est pret!"
        break
    fi
    echo "  En attente de SQL Server... ($i/30)"
    sleep 2
done

# Executer les scripts FDW
echo "Configuration des serveurs FDW..."
psql -U "$PG_USER" -d "$PG_DB" -f /docker-entrypoint-fdw-init/04_create_fdw_servers.sql || true

echo "Creation des foreign tables..."
psql -U "$PG_USER" -d "$PG_DB" -f /docker-entrypoint-fdw-init/05_create_foreign_tables.sql || true

echo "Creation des tables de mapping..."
psql -U "$PG_USER" -d "$PG_DB" -f /docker-entrypoint-fdw-init/06_create_mapping_tables.sql || true

echo "Creation des vues federatives..."
psql -U "$PG_USER" -d "$PG_DB" -f /docker-entrypoint-fdw-init/07_create_federated_views.sql || true

echo "Creation des vues materialisees..."
psql -U "$PG_USER" -d "$PG_DB" -f /docker-entrypoint-fdw-init/08_create_materialized_views.sql || true

# Executer le script de seed PostgreSQL
if [ -f /docker-entrypoint-initdb.d/seed/seed_postgres.sql ]; then
    echo "Execution du script de seed PostgreSQL..."
    psql -U "$PG_USER" -d "$PG_DB" -f /docker-entrypoint-initdb.d/seed/seed_postgres.sql || true
fi

echo "=== Post-initialisation terminee ==="
