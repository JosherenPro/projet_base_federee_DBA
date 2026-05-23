import React, { useState, useEffect } from 'react';
import { getEmployes, getBulletinsPaie, getPaieStats } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import FormatCurrency from '../components/FormatCurrency';

const EmployesPage = () => {
  const [employes, setEmployes] = useState([]);
  const [bulletins, setBulletins] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('employes');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ id_agence: '', poste: '', search: '' });

  const pageSize = 20;

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize, ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)) };
      if (activeTab === 'employes') {
        const res = await getEmployes(params);
        setEmployes(res.data.employes);
        setTotal(res.data.total);
      } else {
        const [bulletinsRes, statsRes] = await Promise.all([getBulletinsPaie(params), getPaieStats()]);
        setBulletins(bulletinsRes.data.bulletins);
        setTotal(bulletinsRes.data.total);
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, filters, activeTab]);

  const totalPages = Math.ceil(total / pageSize);

  if (loading && page === 1) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Employes & Paie</h1>

      <div className="flex gap-2 border-b">
        <button onClick={() => { setActiveTab('employes'); setPage(1); }} className={`px-4 py-2 ${activeTab === 'employes' ? 'border-b-2 border-blue-600 font-semibold' : ''}`}>Employes</button>
        <button onClick={() => { setActiveTab('paie'); setPage(1); }} className={`px-4 py-2 ${activeTab === 'paie' ? 'border-b-2 border-blue-600 font-semibold' : ''}`}>Bulletins de Paie</button>
      </div>

      {activeTab === 'paie' && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Total Bulletins</p>
            <p className="text-2xl font-bold">{stats.total_bulletins}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Masse Salariale Brute</p>
            <p className="text-2xl font-bold"><FormatCurrency amount={stats.masse_salariale_brute} /></p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Masse Salariale Net</p>
            <p className="text-2xl font-bold"><FormatCurrency amount={stats.masse_salariale_net} /></p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Salaire Moyen</p>
            <p className="text-2xl font-bold"><FormatCurrency amount={stats.salaire_moyen} /></p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b flex gap-4 flex-wrap">
          {activeTab === 'employes' ? (
            <>
              <input type="text" placeholder="Rechercher..." value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})} className="p-2 border rounded" />
              <select value={filters.id_agence} onChange={(e) => setFilters({...filters, id_agence: e.target.value, page: 1})} className="p-2 border rounded">
                <option value="">Toutes agences</option>
                <option value="1">Lome</option>
                <option value="2">Kpalime</option>
                <option value="3">Sokode</option>
                <option value="4">Kara</option>
                <option value="5">Dapaong</option>
              </select>
            </>
          ) : (
            <>
              <select value={filters.mois} onChange={(e) => setFilters({...filters, mois: e.target.value, page: 1})} className="p-2 border rounded">
                <option value="">Tous mois</option>
                {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('fr-FR', {month: 'long'})}</option>)}
              </select>
              <select value={filters.annee} onChange={(e) => setFilters({...filters, annee: e.target.value, page: 1})} className="p-2 border rounded">
                <option value="">Toutes annees</option>
                <option value="2024">2024</option>
              </select>
            </>
          )}
        </div>

        {activeTab === 'employes' ? (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Poste</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agence</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Embauche</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {employes.map((e) => (
                <tr key={e.id_employe} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{e.nom} {e.prenom}</td>
                  <td className="px-4 py-3">{e.poste}</td>
                  <td className="px-4 py-3">{e.agence_nom}</td>
                  <td className="px-4 py-3">{new Date(e.date_embauche).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employe</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Periode</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brut</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net a Payer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bulletins.map((b) => (
                <tr key={b.id_bulletin} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{b.employe_nom} {b.employe_prenom}</td>
                  <td className="px-4 py-3">{new Date(0, b.mois-1).toLocaleString('fr-FR', {month: 'long'})} {b.annee}</td>
                  <td className="px-4 py-3"><FormatCurrency amount={b.salaire_brut} /></td>
                  <td className="px-4 py-3"><FormatCurrency amount={b.salaire_net} /></td>
                  <td className="px-4 py-3 font-semibold"><FormatCurrency amount={b.net_a_payer} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div className="p-4 border-t flex justify-between items-center">
            <p className="text-sm text-gray-500">{total} resultats</p>
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

export default EmployesPage;
