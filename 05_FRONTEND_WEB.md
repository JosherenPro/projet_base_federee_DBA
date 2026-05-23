# PROMPT 05 - Interface Web Frontend (React.js)

## OBJECTIF

Creer l'interface web complete avec React.js pour le systeme de bases de donnees federees. L'interface doit permettre de visualiser les donnees federees, naviguer dans les clients, credits, operations et tableau de bord.

## PRE-REQUIS

Le backend FastAPI (prompt 04) est operationnel avec tous les endpoints REST fonctionnels.

## STACK TECHNIQUE

- **React.js 18+** avec **Vite**
- **React Router v6** (navigation SPA)
- **Axios** ou **Fetch API** (appels HTTP vers le backend)
- **Tailwind CSS 4** (stylisme utilitaire)
- **Recharts** ou **Chart.js** (graphiques pour le tableau de bord)
- **Lucide React** (icones)

---

## PARTIE A : Configuration du projet

### Fichier : `frontend/package.json`

Dependencies necessaires :
```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.22.0",
    "axios": "^1.6.0",
    "recharts": "^2.12.0",
    "lucide-react": "^0.330.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "tailwindcss": "^4.0.0",
    "vite": "^5.1.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

### Fichier : `frontend/vite.config.js`

Configurer le proxy pour les appels API vers le backend FastAPI :

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://fastapi-backend:8000',
        changeOrigin: true
      }
    }
  }
})
```

### Fichier : `frontend/src/api/index.js`

Couche d'acces API centralisee :

```javascript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

// Intercepteur pour la gestion des erreurs
api.interceptors.response.use(
  response => response,
  error => {
    console.error('Erreur API:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// === Clients ===
export const getClients = (params) => api.get('/clients', { params });
export const getClientByICF = (icf) => api.get(`/clients/${icf}`);
export const createClient = (data) => api.post('/clients', data);

// === Credits ===
export const getCredits = (params) => api.get('/credits', { params });
export const getCreditById = (id) => api.get(`/credits/${id}`);
export const createCredit = (data) => api.post('/credits', data);

// === Operations ===
export const getOperations = (params) => api.get('/operations', { params });
export const createTransaction = (data) => api.post('/operations/transactions', data);

// === Dashboard ===
export const getDashboard = () => api.get('/dashboard');
export const getDashboardAgence = (id) => api.get(`/dashboard/agence/${id}`);
export const getClientsRisqueEleve = () => api.get('/dashboard/risque');
export const refreshMaterializedViews = () => api.post('/dashboard/refresh');

// === Federation ===
export const getFederationStatus = () => api.get('/federation/status');
export const getHealthCheck = () => api.get('/health');

export default api;
```

---

## PARTIE B : Composants de Layout

### Fichier : `frontend/src/components/Layout.jsx`

Layout principal avec :
- **Sidebar** de navigation avec les liens : Tableau de Bord, Clients, Credits, Operations, Etat Federation
- **Header** avec le titre du systeme et un indicateur d'etat de la federation (vert/rouge)
- **Zone de contenu principale** ou sont rendues les pages
- Design responsive : sidebar repliable sur mobile

Palette de couleurs :
- Primaire : Bleu marine (#1e3a5f) -代表 confiance et serieux bancaire
- Secondaire : Or (#c8a951) - represente la valeur financiere
- Accent : Vert (#059669) - represente la croissance
- Danger : Rouge (#dc2626) - represente le risque
- Fond : Gris clair (#f8fafc)

### Fichier : `frontend/src/components/FederationStatus.jsx`

Composant qui affiche l'etat de la federation en temps reel :
- 3 indicateurs pour chaque base de donnees (PostgreSQL, MySQL, SQL Server)
- Vert = connecte, Rouge = deconnecte, Jaune = partiellement disponible
- Affiche le nombre de foreign tables accessibles
- Bouton pour rafraichir le statut

---

## PARTIE C : Pages et Composants Metier

### Page : Tableau de Bord (`frontend/src/pages/DashboardPage.jsx`)

Cette page est la page d'accueil du systeme. Elle doit afficher :

1. **Cartes d'indicateurs cles** (en haut) :
   - Total comptes actifs
   - Solde total global (en FCFA)
   - Total credits approuves
   - Volume total credits (en FCFA)
   - Nombre d'agences

2. **Graphiques** (milieu) :
   - Bar chart : Solde total par agence
   - Pie chart : Repartition des credits par statut (en_cours, approuve, rejete, cloture)
   - Line chart : Volume des operations par agence

3. **Tableau des agences** (bas) :
   - Tableau recapitulatif avec toutes les metriques par agence
   - Ligne de totaux

4. **Alerte risque** (sidebar droite) :
   - Liste des clients a risque eleve (top 5)
   - Badge de niveau de risque colore (rouge = tres_eleve, orange = eleve)

### Page : Clients (`frontend/src/pages/ClientsPage.jsx`)

1. **Barre de recherche et filtres** :
   - Recherche par nom/prenom
   - Filtre par niveau de risque (dropdown)
   - Filtre par ville d'agence (dropdown)

2. **Tableau des clients** :
   - Colonnes : Nom, Prenom, ICF (tronque), Agence, Nb Comptes, Solde Total, Score Risque, Niveau Risque
   - Le niveau de risque est affiche avec un badge colore
   - Click sur une ligne ouvre le detail du client

3. **Pagination** :
   - Navigation page par page avec selecteur de taille de page (10, 20, 50)

### Composant : Client Detail (`frontend/src/components/ClientDetail.jsx`)

Modal ou page dediee affichant :
- Informations personnelles du client
- Liste de ses comptes avec soldes
- Historique de scoring (evolution du score)
- Dossiers de credit associes
- Ecritures comptables liees

### Page : Credits (`frontend/src/pages/CreditsPage.jsx`)

1. **Filtres** :
   - Par statut (en_cours, approuve, rejete, cloture)
   - Par niveau de risque du client

2. **Tableau des dossiers de credit** :
   - Colonnes : ID, Client, Montant Demande, Montant Accorde, Duree, Taux, Statut, Garanties, Echeances Impayees
   - Le statut est affiche avec un badge colore
   - Click ouvre le detail du dossier

3. **Formulaire de creation de dossier** (dialog modal) :
   - Champs : ICF client, montant demande, duree, taux, id_agent
   - Validation des champs

### Page : Operations (`frontend/src/pages/OperationsPage.jsx`)

1. **Filtres** :
   - Par date (debut, fin)
   - Par type d'operation
   - Par agence

2. **Tableau des operations** :
   - Colonnes : ID, Type, Montant, Devise, Date, Compte Source, Compte Dest, Libelle Comptable, Journal
   - Les montants sont formates en FCFA avec separateur de milliers

3. **Formulaire de creation de transaction** (dialog modal) :
   - Champs : type_operation, montant, devise, id_compte_source, id_compte_dest

### Page : Etat Federation (`frontend/src/pages/FederationPage.jsx`)

Page de monitoring technique :
1. **Etat des serveurs FDW** : tableau avec les 3 bases, leur hote, port, etat
2. **Foreign tables accessibles** : liste des 8 foreign tables avec leur serveur source
3. **Vues federees** : liste des 4 vues avec leur description et nombre de lignes
4. **Bouton de test** : execute les requetes de verification et affiche les resultats
5. **Bouton de rafraichissement** des vues materialisees

---

## PARTIE D : Composants Reutilisables

### Composants a creer :

- `Badge.jsx` : Badge colore pour les statuts et niveaux de risque
  - Props : `text`, `color` (green/yellow/orange/red/gray), `size` (sm/md/lg)
- `DataTable.jsx` : Tableau de donnees generique avec pagination
  - Props : `columns`, `data`, `totalRows`, `page`, `pageSize`, `onPageChange`, `onRowClick`
- `StatCard.jsx` : Carte d'indicateur avec icone, valeur et label
  - Props : `icon`, `value`, `label`, `color`, `format` (number/currency/percent)
- `SearchBar.jsx` : Barre de recherche avec debounce
  - Props : `placeholder`, `onSearch`, `debounceMs` (default 300)
- `FilterDropdown.jsx` : Dropdown de filtre generique
  - Props : `label`, `options`, `value`, `onChange`
- `LoadingSpinner.jsx` : Indicateur de chargement
- `ErrorMessage.jsx` : Affichage d'erreur avec retry
- `FormatCurrency.jsx` : Formatage des montants en FCFA
  - Exemple : `1 500 000 XOF`

---

## PARTIE E : Formatage et Localisation

### Regles de formatage :

- **Montants** : Format francais avec espace comme separateur de milliers + " XOF"
  - Exemple : `1 500 000 XOF`, `250 000 XOF`
- **Dates** : Format francais `JJ/MM/AAAA`
  - Exemple : `15/03/2025`
- **Pourcentages** : Symbole % apres le nombre avec virgule decimale
  - Exemple : `8,5 %`, `12,0 %`
- **ICF** : Affiche les 8 premiers caracteres + "..."
  - Exemple : `a1b2c3d4...`

### Textes de l'interface :

Tous les textes de l'interface doivent etre en **FRANCAIS** :
- "Tableau de Bord" (pas "Dashboard")
- "Clients" (pas "Customers")
- "Credits" (pas "Loans")
- "Operations" (pas "Transactions")
- "Etat de la Federation" (pas "Federation Status")
- "Rechercher un client..." (pas "Search client...")
- "Solde Total" (pas "Total Balance")
- "Score de Risque" (pas "Risk Score")
- "Niveau de Risque" (pas "Risk Level")
- "Montant Demande" (pas "Requested Amount")
- "Montant Accorde" (pas "Approved Amount")
- "Echeances Impayees" (pas "Overdue Installments")
- "Volume des Credits" (pas "Loan Volume")

## LIVRABLES ATTENDUS

- [ ] `frontend/package.json`
- [ ] `frontend/vite.config.js`
- [ ] `frontend/tailwind.config.js`
- [ ] `frontend/postcss.config.js`
- [ ] `frontend/index.html`
- [ ] `frontend/src/main.jsx`
- [ ] `frontend/src/App.jsx` (avec React Router)
- [ ] `frontend/src/api/index.js`
- [ ] `frontend/src/components/Layout.jsx`
- [ ] `frontend/src/components/FederationStatus.jsx`
- [ ] `frontend/src/components/Badge.jsx`
- [ ] `frontend/src/components/DataTable.jsx`
- [ ] `frontend/src/components/StatCard.jsx`
- [ ] `frontend/src/components/SearchBar.jsx`
- [ ] `frontend/src/components/FilterDropdown.jsx`
- [ ] `frontend/src/components/LoadingSpinner.jsx`
- [ ] `frontend/src/components/ErrorMessage.jsx`
- [ ] `frontend/src/components/FormatCurrency.jsx`
- [ ] `frontend/src/components/ClientDetail.jsx`
- [ ] `frontend/src/components/CreditDetail.jsx`
- [ ] `frontend/src/components/DashboardCharts.jsx`
- [ ] `frontend/src/pages/DashboardPage.jsx`
- [ ] `frontend/src/pages/ClientsPage.jsx`
- [ ] `frontend/src/pages/CreditsPage.jsx`
- [ ] `frontend/src/pages/OperationsPage.jsx`
- [ ] `frontend/src/pages/FederationPage.jsx`
- [ ] `frontend/Dockerfile`
- [ ] Verification : `npm run dev` demarre l'interface, les pages s'affichent

## NOTES IMPORTANTES

- Utiliser des composants fonctionnels avec hooks (useState, useEffect, useCallback, useMemo).
- Gerer les etats de chargement (loading) et d'erreur pour chaque appel API.
- Les graphiques doivent etre reactifs et s'adapter a la taille de la fenetre.
- L'interface doit etre responsive et fonctionner sur desktop et tablette.
- Ne pas utiliser de librairie UI lourde (Material-UI, Ant Design). Preferer Tailwind CSS pur pour garder le controle du design.
- Les appels API doivent etre debounced pour la recherche en temps reel.
- Utiliser `React.lazy` et `Suspense` pour le lazy loading des pages.
