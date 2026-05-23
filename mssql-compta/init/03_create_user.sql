-- Creation de l'utilisateur FDW pour SQL Server
CREATE LOGIN fdw_user WITH PASSWORD = 'FdwMssqlT0g0!';
CREATE USER fdw_user FOR LOGIN fdw_user;
ALTER ROLE db_datareader ADD MEMBER fdw_user;
GO
