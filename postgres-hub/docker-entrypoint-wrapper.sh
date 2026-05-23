#!/bin/bash
# Wrapper pour l'entrypoint PostgreSQL
# Execute l'entrypoint standard, puis le post-init en arriere-plan

# Executer l'entrypoint PostgreSQL standard en arriere-plan
docker-entrypoint-original.sh "$@" &
PG_PID=$!

# Attendre que PostgreSQL soit pret
echo "Attente que PostgreSQL soit pret..."
for i in {1..60}; do
    if pg_isready -U "${POSTGRES_USER:-banque_admin}" -d "${POSTGRES_DB:-banque_hub}" > /dev/null 2>&1; then
        echo "PostgreSQL est pret!"
        break
    fi
    sleep 1
done

# Executer le post-init en arriere-plan
/docker-entrypoint-post-init/post-init.sh &

# Attendre le processus PostgreSQL
wait $PG_PID
