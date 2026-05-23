-- =============================================
-- Creation des tables MySQL - Credits & Risque
-- =============================================

CREATE TABLE dossier_credit (
    id_dossier INT AUTO_INCREMENT PRIMARY KEY,
    montant_demande DECIMAL(15,2) NOT NULL CHECK (montant_demande > 0),
    montant_accorde DECIMAL(15,2),
    duree_mois INT NOT NULL CHECK (duree_mois > 0),
    taux DECIMAL(5,2) NOT NULL CHECK (taux > 0 AND taux <= 100),
    statut ENUM('en_cours', 'approuve', 'rejete', 'cloture') NOT NULL DEFAULT 'en_cours',
    icf CHAR(64) NOT NULL,
    id_agent INT,
    date_soumission DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_decision DATETIME,
    motif_rejet TEXT,

    INDEX idx_dossier_icf (icf),
    INDEX idx_dossier_statut (statut),
    INDEX idx_dossier_date (date_soumission)
) ENGINE=InnoDB;

CREATE TABLE garantie (
    id_garantie INT AUTO_INCREMENT PRIMARY KEY,
    type_garantie ENUM('nantissement', 'caution', 'hypotheque', 'depot_gage', 'autre') NOT NULL,
    valeur_estimee DECIMAL(15,2) NOT NULL CHECK (valeur_estimee > 0),
    description TEXT,
    id_dossier INT NOT NULL,
    date_evaluation DATE,

    INDEX idx_garantie_dossier (id_dossier),
    CONSTRAINT fk_garantie_dossier FOREIGN KEY (id_dossier) REFERENCES dossier_credit(id_dossier)
) ENGINE=InnoDB;

CREATE TABLE echeancier (
    id_echeance INT AUTO_INCREMENT PRIMARY KEY,
    date_echeance DATE NOT NULL,
    montant_capital DECIMAL(15,2) NOT NULL CHECK (montant_capital >= 0),
    montant_interet DECIMAL(15,2) NOT NULL CHECK (montant_interet >= 0),
    statut_paiement ENUM('pending', 'paid', 'overdue') NOT NULL DEFAULT 'pending',
    date_paiement_effectif DATE,
    id_dossier INT NOT NULL,

    INDEX idx_echeance_dossier (id_dossier),
    INDEX idx_echeance_date (date_echeance),
    INDEX idx_echeance_statut (statut_paiement),
    CONSTRAINT fk_echeance_dossier FOREIGN KEY (id_dossier) REFERENCES dossier_credit(id_dossier)
) ENGINE=InnoDB;

CREATE TABLE scoring (
    id_scoring INT AUTO_INCREMENT PRIMARY KEY,
    score INT NOT NULL CHECK (score BETWEEN 0 AND 100),
    niveau_risque ENUM('faible', 'moyen', 'eleve', 'tres_eleve') NOT NULL,
    date_evaluation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    icf CHAR(64) NOT NULL,
    commentaire TEXT,

    INDEX idx_scoring_icf (icf),
    INDEX idx_scoring_icf_date (icf, date_evaluation),
    INDEX idx_scoring_niveau (niveau_risque)
) ENGINE=InnoDB;

-- Trigger pour determiner le niveau de risque
DELIMITER //
CREATE TRIGGER trg_determiner_niveau_risque
BEFORE INSERT ON scoring
FOR EACH ROW
BEGIN
    IF NEW.niveau_risque IS NULL OR NEW.niveau_risque = '' THEN
        IF NEW.score <= 25 THEN
            SET NEW.niveau_risque = 'tres_eleve';
        ELSEIF NEW.score <= 50 THEN
            SET NEW.niveau_risque = 'eleve';
        ELSEIF NEW.score <= 75 THEN
            SET NEW.niveau_risque = 'moyen';
        ELSE
            SET NEW.niveau_risque = 'faible';
        END IF;
    END IF;
END//
DELIMITER ;
