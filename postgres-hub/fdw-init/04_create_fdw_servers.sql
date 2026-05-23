-- =============================================
-- Configuration des serveurs distants FDW
-- =============================================

-- Creer les extensions FDW (si pas deja fait)
CREATE EXTENSION IF NOT EXISTS mysql_fdw;
CREATE EXTENSION IF NOT EXISTS tds_fdw;

-- Creer le serveur MySQL distant
CREATE SERVER mysql_server
    FOREIGN DATA WRAPPER mysql_fdw
    OPTIONS (
        host 'mysql-credit',
        port '3306'
    );

-- Creer le user mapping pour MySQL
CREATE USER MAPPING FOR banque_admin
    SERVER mysql_server
    OPTIONS (
        username 'fdw_user',
        password 'FdwT0g0!2025'
    );

-- Creer le serveur SQL Server distant
CREATE SERVER mssql_server
    FOREIGN DATA WRAPPER tds_fdw
    OPTIONS (
        servername 'mssql-compta',
        port '1433',
        database 'banque_compta',
        tds_version '7.3'
    );

-- Creer le user mapping pour SQL Server
CREATE USER MAPPING FOR banque_admin
    SERVER mssql_server
    OPTIONS (
        username 'fdw_user',
        password 'FdwMssqlT0g0!'
    );
