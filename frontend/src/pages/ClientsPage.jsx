import React, { useState, useEffect } from 'react';
import { getClients } from '../api';
import Badge from '../components/Badge';
import FormatCurrency from '../components/FormatCurrency';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const riskColors = {
  faible: 'green',
  moyen: 'yellow',
  eleve: 'orange',
  tres_eleve: 'red',
};

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [risqueFilter, setRisqueFilter] = useState('');
  const [villeFilter, setVilleFilter] = useState('');
  const pageSize = 20;

  const fetchClients = async () => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize };
      if (search) params.search = search;
      if (risqueFilter) params.niveau_risque = risqueFilter;
      if (villeFilter) params.agence_ville = villeFilter;
      const res = await getClients(params);
      setClients(res.data.clients);
      setTotal(res.data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [page, risqueFilter, villeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchClients();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  if (loading && clients.length === 0) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchClients} />;

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Clients</h1>

      <div className="flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Rechercher un client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
        />
        <select
          value={risqueFilter}
          onChange={(e) => { setRisqueFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">Tous les risques</option>
          <option value="faible">Faible</option>
          <option value="moyen">Moyen</option>
          <option value="eleve">Eleve</option>
          <option value="tres_eleve">Tres eleve</option>
        </select>
        <select
          value={villeFilter}
          onChange={(e) => { setVilleFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">Toutes les villes</option>
          <option value="Lome">Lome</option>
          <option value="Kpalime">Kpalime</option>
          <option value="Sokode">Sokode</option>
          <option value="Kara">Kara</option>
          <option value="Dapaong">Dapaong</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Nom</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Prenom</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">ICF</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Agence</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Comptes</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Solde total</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Score</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Risque</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.map((client) => (
                <tr key={client.id_client} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{client.nom}</td>
                  <td className="px-4 py-3">{client.prenom}</td>
                  <td className="px-4 py-3 font-mono text-xs">{client.icf.slice(0, 8)}...</td>
                  <td className="px-4 py-3">{client.agence_ville}</td>
                  <td className="px-4 py-3 text-right">{client.nombre_comptes}</td>
                  <td className="px-4 py-3 text-right"><FormatCurrency value={client.solde_total} /></td>
                  <td className="px-4 py-3 text-center">{client.score_risque ?? '-'}</td>
                  <td className="px-4 py-3 text-center">
                    {client.niveau_risque ? (
                      <Badge text={client.niveau_risque} color={riskColors[client.niveau_risque]} size="sm" />
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">{total} client(s)</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Prec.
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 border rounded ${p === page ? 'bg-[#1e3a5f] text-white' : ''}`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Suiv.
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
