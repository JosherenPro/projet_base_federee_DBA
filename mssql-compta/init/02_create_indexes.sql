-- Index pour les ecritures comptables
CREATE INDEX idx_ecriture_date ON ecriture_comptable(date_ecriture);
CREATE INDEX idx_ecriture_compte ON ecriture_comptable(numero_compte);
CREATE INDEX idx_ecriture_agence ON ecriture_comptable(id_agence);
CREATE INDEX idx_ecriture_compte_date ON ecriture_comptable(numero_compte, date_ecriture);

-- Index pour les bulletins de paie
CREATE INDEX idx_bulletin_employe ON bulletin_paie(id_employe);
CREATE INDEX idx_bulletin_periode ON bulletin_paie(annee, mois);

-- Index pour les operations d'agence
CREATE INDEX idx_operation_agence ON operation_agence(id_agence);
CREATE INDEX idx_operation_date ON operation_agence(date_operation);
GO
