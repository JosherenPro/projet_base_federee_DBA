FROM mcr.microsoft.com/mssql/server:2022-latest

USER root

# Installer curl pour le healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Copier les scripts d'initialisation et de seed
COPY entrypoint.sh /scripts/entrypoint.sh
COPY init/ /scripts/init/
COPY seed/ /scripts/seed/
RUN chmod +x /scripts/entrypoint.sh

USER mssql

CMD ["/scripts/entrypoint.sh"]
