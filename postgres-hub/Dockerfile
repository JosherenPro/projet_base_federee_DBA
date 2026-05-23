FROM postgres:16

# Installer les dependances de compilation et certificats SSL
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    ca-certificates \
    libmariadb-dev \
    libmariadb-dev-compat \
    freetds-dev \
    freetds-bin \
    freetds-common \
    postgresql-server-dev-16 \
    pkg-config \
    python3 \
    && rm -rf /var/lib/apt/lists/* \
    && update-ca-certificates

# Creer le lien symbolique pour mysql.h
RUN ln -sf /usr/include/mariadb /usr/include/mysql 2>/dev/null || true
RUN mkdir -p /usr/include/mysql && ln -sf /usr/include/mariadb/* /usr/include/mysql/ 2>/dev/null || true

# Compiler et installer mysql_fdw
RUN GIT_SSL_NO_VERIFY=true git clone --branch master https://github.com/EnterpriseDB/mysql_fdw.git /tmp/mysql_fdw \
    && cd /tmp/mysql_fdw \
    && make USE_PGXS=1 \
    && make USE_PGXS=1 install \
    && rm -rf /tmp/mysql_fdw

# Compiler et installer tds_fdw
RUN GIT_SSL_NO_VERIFY=true git clone --branch master https://github.com/tds-fdw/tds_fdw.git /tmp/tds_fdw \
    && cd /tmp/tds_fdw \
    && make USE_PGXS=1 \
    && make USE_PGXS=1 install \
    && rm -rf /tmp/tds_fdw

# Copier les scripts d'initialisation et de seed
COPY init/ /docker-entrypoint-initdb.d/
COPY seed/ /docker-entrypoint-initdb.d/seed/

# Copier les scripts FDW (executes par post-init)
COPY fdw-init/ /docker-entrypoint-fdw-init/

# Copier le script post-init
COPY post-init/ /docker-entrypoint-post-init/
RUN chmod +x /docker-entrypoint-post-init/post-init.sh

# Modifier l'entrypoint pour executer le post-init apres l'init standard
RUN cp /usr/local/bin/docker-entrypoint.sh /usr/local/bin/docker-entrypoint-original.sh

COPY docker-entrypoint-wrapper.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
