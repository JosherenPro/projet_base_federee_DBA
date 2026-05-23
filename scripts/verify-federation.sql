-- Test 1 : Verifier que les extensions sont installees
SELECT extname, extversion FROM pg_extension WHERE extname IN ('mysql_fdw', 'tds_fdw');

-- Test 2 : Verifier que les serveurs distants sont configures
SELECT srvname, srvtype, srvoptions FROM pg_foreign_server;

-- Test 3 : Lister les foreign tables
SELECT ftrelid::regclass AS foreign_table, ftserver::regclass AS server
FROM pg_foreign_table;

-- Test 4 : Tester l'acces aux donnees MySQL
SELECT COUNT(*) AS nb_dossiers FROM fdw_dossier_credit;
SELECT COUNT(*) AS nb_scorings FROM fdw_scoring;

-- Test 5 : Tester l'acces aux donnees SQL Server
SELECT COUNT(*) AS nb_ecritures FROM fdw_ecriture_comptable;
SELECT COUNT(*) AS nb_operations FROM fdw_operation_agence;

-- Test 6 : Tester les vues federees
SELECT * FROM vue_client_complet LIMIT 5;
SELECT * FROM vue_credit_detail LIMIT 5;
SELECT * FROM vue_operation_comptable LIMIT 5;
SELECT * FROM vue_tableau_bord;

-- Test 7 : Verifier le predicate pushdown
EXPLAIN (VERBOSE, COSTS OFF)
SELECT * FROM fdw_dossier_credit WHERE statut = 'approuve';
