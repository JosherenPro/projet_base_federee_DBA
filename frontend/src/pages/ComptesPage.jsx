import React, { useState, useEffect } from 'react';
import { getComptes, getCompteStats, createCompte, getClients } from '../api';
import { exportToCSV } from '../utils/export';
import Badge from '../components/Badge';
import FormatCurrency from '../components/FormatCurrency';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const ComptesPage = () => {
  const [comptes, setComptes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ type_compte: '', statut: '', search: '' });
  const [showForm, setShowForm] = useState(false);
  const [newCompte, setNewCompte] = useState({ type_compte: 'courant', id_client: '', id_agence: '1', solde_initial: 0 });
  const [formError, setFormError] = useState('');
  const [clients, setClients] = useState([]);

  const pageSize = 20;

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, page_size: pageSize, ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)) };
      const [comptesRes, statsRes] = await Promise.all([getComptes(params), getCompteStats()]);
      setComptes(comptesRes.data.comptes);
      setTotal(comptesRes.data.total);
      setStats(statsRes.data);
    } catch (err) {
      setError('Erreur lors du chargement des comptes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, filters]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await getClients({ page_size: 100 });
        setClients(res.data.clients);
      } catch (err) {
        console.error(err);
      }
    };
    fetchClients();
  }, []);

  const handleExport = () => {
    exportToCSV(comptes, 'comptes_export', ['id_compte', 'iban', 'type_compte', 'solde', 'statut', 'client_nom', 'client_prenom', 'agence_nom']);
  };

  const handleCreateCompte = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!newCompte.id_client || !newCompte.id_agence) {
      setFormError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    try {
      await createCompte({ ...newCompte, id_client: parseInt(newCompte.id_client), id_agence: parseInt(newCompte.id_agence), solde_initial: parseFloat(newCompte.solde_initial) });
      setShowForm(false);
      setNewCompte({ type_compte: 'courant', id_client: '', id_agence: '1', solde_initial: 0 });
      fetchData();
    } catch (err) {
      setFormError('Erreur lors de la creation du compte');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  if (loading && page === 1) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Comptes</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            {showForm ? 'Annuler' : '+ Nouveau Compte'}
          </button>
          <button onClick={handleExport} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Export CSV
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Total Comptes</p>
            <p className="text-2xl font-bold">{stats.total_comptes}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Comptes Actifs</p>
            <p className="text-2xl font-bold text-green-600">{stats.comptes_actifs}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Solde Total</p>
            <p className="text-2xl font-bold"><FormatCurrency amount={stats.solde_total} /></p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Solde Moyen</p>
            <p className="text-2xl font-bold"><FormatCurrency amount={stats.solde_moyen} /></p>
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Nouveau Compte</h2>
          {formError && <p className="text-red-500 mb-4">{formError}</p>}
          <form onSubmit={handleCreateCompte} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type de compte</label>
              <select value={newCompte.type_compte} onChange={(e) => setNewCompte({...newCompte, type_compte: e.target.value})} className="w-full p-2 border rounded">
                <option value="courant">Courant</option>
                <option value="epargne">Epargne</option>
                <option value="terme">Terme</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Client *</label>
              <select value={newCompte.id_client} onChange={(e) => setNewCompte({...newCompte, id_client: e.target.value})} className="w-full p-2 border rounded" required>
                <option value="">Selectionner un client</option>
                {clients.map(c => <option key={c.id_client} value={c.id_client}>{c.nom} {c.prenom} (ICF: {c.icf?.substring(0, 16)}...)</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Agence *</label>
              <select value={newCompte.id_agence} onChange={(e) => setNewCompte({...newCompte, id_agence: e.target.value})} className="w-full p-2 border rounded">
                <option value="1">Lome</option>
                <option value="2">Kpalime</option>
                <option value="3">Sokode</option>
                <option value="4">Kara</option>
                <option value="5">Dapaong</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Solde initial (XOF)</label>
              <input type="number" value={newCompte.solde_initial} onChange={(e) => setNewCompte({...newCompte, solde_initial: e.target.value})} className="w-full p-2 border rounded" />
            </div>
            <button type="submit" className="md:col-span-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Creer le compte</button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b flex gap-4 flex-wrap">
          <input type="text" placeholder="Rechercher (client, IBAN)..." value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})} className="p-2 border rounded" />
          <select value={filters.type_compte} onChange={(e) => setFilters({...filters, type_compte: e.target.value, page: 1})} className="p-2 border rounded">
            <option value="">Tous types</option>
            <option value="courant">Courant</option>
            <option value="epargne">Epargne</option>
            <option value="terme">Terme</option>
          </select>
          <select value={filters.statut} onChange={(e) => setFilters({...filters, statut: e.target.value, page: 1})} className="p-2 border rounded">
            <option value="">Tous statuts</option>
            <option value="actif">Actif</option>
            <option value="bloque">Bloque</option>
            <option value="ferme">Ferme</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IBAN</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Solde</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agence</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {comptes.map((c) => (
                <tr key={c.id_compte} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm">{c.iban}</td>
                  <td className="px-4 py-3">{c.client_nom} {c.client_prenom}</td>
                  <td className="px-4 py-3"><Badge type={c.type_compte} /></td>
                  <td className="px-4 py-3"><FormatCurrency amount={c.solde} /></td>
                  <td className="px-4 py-3">{c.agence_nom}</td>
                  <td className="px-4 py-3"><Badge status={c.statut} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t flex justify-between items-center">
            <p className="text-sm text-gray-500">{total} comptes</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-50">Precedent</button>
              <span className="px-3 py-1">Page {page}/{totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 border rounded disabled:opacity-50">Suivant</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComptesPage;
