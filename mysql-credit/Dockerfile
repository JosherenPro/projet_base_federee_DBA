FROM mysql:8.0

# Configurer le charset utf8mb4
COPY my.cnf /etc/mysql/conf.d/my.cnf

# Copier les scripts d'initialisation
COPY init/ /docker-entrypoint-initdb.d/
