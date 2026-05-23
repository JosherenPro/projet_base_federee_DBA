import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.response.use(
  response => response,
  error => {
    console.error('Erreur API:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const getClients = (params) => api.get('/clients', { params });
export const getClientByICF = (icf) => api.get(`/clients/${icf}`);
export const createClient = (data) => api.post('/clients', data);
export const searchClients = (search) => api.get('/clients', { params: { search, page_size: 10 } });

export const getCredits = (params) => api.get('/credits', { params });
export const getCreditById = (id) => api.get(`/credits/${id}`);
export const createCredit = (data) => api.post('/credits', data);
export const updateCreditDecision = (id, statut, montantAccorde, motifRejet) => 
  api.put(`/credits/${id}/decision`, null, { params: { statut, montant_accorde: montantAccorde, motif_rejet: motifRejet } });
export const getCreditEcheancier = (id) => api.get(`/credits/${id}/echeancier`);
export const updateEcheanceStatut = (idDossier, idEcheance, statut) => 
  api.put(`/credits/${idDossier}/echeancier/${idEcheance}/statut`, null, { params: { statut } });

export const getOperations = (params) => api.get('/operations', { params });
export const getTransactions = (params) => api.get('/operations/transactions', { params });
export const createTransaction = (data) => api.post('/operations/transactions', data);

export const getComptes = (params) => api.get('/comptes', { params });
export const getCompteById = (id) => api.get(`/comptes/${id}`);
export const createCompte = (data) => api.post('/comptes', data);
export const updateCompteStatut = (id, statut) => api.put(`/comptes/${id}/statut`, { statut });
export const getCompteTransactions = (id, params) => api.get(`/comptes/${id}/transactions`, { params });
export const getCompteStats = () => api.get('/comptes/stats');

export const getDashboard = () => api.get('/dashboard');
export const getDashboardAgence = (id) => api.get(`/dashboard/agence/${id}`);
export const getClientsRisqueEleve = () => api.get('/dashboard/risque');
export const refreshMaterializedViews = () => api.post('/dashboard/refresh');

export const getFederationStatus = () => api.get('/federation/status');
export const getHealthCheck = () => api.get('/health');

export const getEmployes = (params) => api.get('/employes', { params });
export const getBulletinsPaie = (params) => api.get('/employes/paie', { params });
export const getPaieStats = () => api.get('/employes/paie/stats');

export const getAlertes = (typeAlerte) => api.get('/alertes', { params: { type_alerte: typeAlerte } });
export const getResumeAlertes = () => api.get('/alertes/resume');
export const getAlertesSoldeBas = (seuil) => api.get('/alertes/solde-bas', { params: { seuil } });
export const getAlertesEcheancesRetard = () => api.get('/alertes/echeances-retard');
export const getAlertesTransactionsSuspectes = (seuil) => api.get('/alertes/transactions-suspectes', { params: { seuil } });

export const getRapportReconciliation = () => api.get('/reconciliation/rapport');
export const getCoherenceComptesCredits = () => api.get('/reconciliation/comptes-credits');
export const getDoublonsICF = () => api.get('/reconciliation/doublons-icf');
export const refreshReconciliation = () => api.post('/reconciliation/refresh');

export const getDatabaseInfo = () => api.get('/database/postgres');
export const getMysqlInfo = () => api.get('/database/mysql');
export const getMssqlInfo = () => api.get('/database/mssql');
export const getDatabaseOverview = () => api.get('/database/overview');
export const executeQuery = (database, data) => api.post(`/database/query?database=${database}`, data);
export const refreshViews = () => api.post('/database/refresh-views');

export default api;
