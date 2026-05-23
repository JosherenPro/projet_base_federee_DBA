#!/bin/bash
# Script d'initialisation SQL Server

# Demarrer SQL Server en arriere-plan
/opt/mssql/bin/sqlservr &
SQL_PID=$!

# Attendre que SQL Server soit pret
echo "Attente du demarrage de SQL Server..."
for i in {1..60}; do
    if /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -Q "SELECT 1" > /dev/null 2>&1; then
        echo "SQL Server est pret!"
        break
    fi
    echo "En attente... ($i/60)"
    sleep 2
done

# Creer la base de donnees
echo "Creation de la base de donnees banque_compta..."
/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -Q "CREATE DATABASE banque_compta" 2>/dev/null || true

# Executer les scripts d'initialisation dans l'ordre
for script in /scripts/init/*.sql; do
    if [ -f "$script" ]; then
        echo "Execution de $script..."
        /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -d banque_compta -i "$script" -b || echo "Erreur lors de l'execution de $script"
    fi
done

# Executer le script de seed
if [ -f /scripts/seed/seed_mssql.sql ]; then
    echo "Execution du script de seed..."
    /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -d banque_compta -i /scripts/seed/seed_mssql.sql -b || echo "Erreur lors de l'execution du seed"
fi

echo "Initialisation SQL Server terminee."

# Garder le processus SQL Server au premier plan
wait $SQL_PID
