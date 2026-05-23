#!/bin/bash
# Script wait-for-it.sh
# Attend qu'un hote:port soit disponible avant de continuer

set -e

HOST="$1"
PORT="$2"
shift 2
TIMEOUT=30

echo "En attente de $HOST:$PORT..."

for i in $(seq 1 $TIMEOUT); do
    if (echo > /dev/tcp/$HOST/$PORT) 2>/dev/null; then
        echo "$HOST:$PORT est disponible!"
        exec "$@"
        exit 0
    fi
    echo "En attente... ($i/$TIMEOUT)"
    sleep 2
done

echo "TIMEOUT: $HOST:$PORT n'est pas disponible apres $TIMEOUT tentatives"
exit 1
