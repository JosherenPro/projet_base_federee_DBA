-- Creation de l'utilisateur FDW pour MySQL
CREATE USER IF NOT EXISTS 'fdw_user'@'%' IDENTIFIED BY 'FdwT0g0!2025';
GRANT SELECT ON banque_credit.* TO 'fdw_user'@'%';
FLUSH PRIVILEGES;
