-- Index pour les jointures federees via ICF
CREATE UNIQUE INDEX idx_client_icf ON client(icf);

-- Index pour la recherche de compte par IBAN
CREATE UNIQUE INDEX idx_compte_iban ON compte(iban);

-- Index pour lister les comptes d'un client
CREATE INDEX idx_compte_client ON compte(id_client);

-- Index pour les requetes temporelles sur les transactions
CREATE INDEX idx_transaction_date ON transaction(date_heure);

-- Index pour l'historique des transactions d'un compte
CREATE INDEX idx_transaction_compte_source ON transaction(id_compte_source);
CREATE INDEX idx_transaction_compte_dest ON transaction(id_compte_dest);

-- Index pour la recherche d'agences par ville
CREATE INDEX idx_agence_ville ON agence(ville);
