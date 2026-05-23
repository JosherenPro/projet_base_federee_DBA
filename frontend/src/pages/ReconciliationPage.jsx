import React, { useState, useEffect } from 'react';
import { getRapportReconciliation, refreshReconciliation } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { CheckCircle, XCircle } from 'lucide-react';

const ReconciliationPage = () => {
  const [rapport, setRapport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRapportReconciliation();
      setRapport(res.data);
    } catch (err) {
      setError('Erreur lors du chargement du rapport');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshReconciliation();
      fetchData();
    } catch (err) {
      setError('Erreur lors de l\'actualisation');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;
  if (!rapport) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Reconciliation des Donnees</h1>
        <button onClick={handleRefresh} disabled={refreshing} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {refreshing ? 'Actualisation...' : 'Actualiser'}
        </button>
      </div>

      <div className={`p-4 rounded-lg ${rapport.statut === 'coherent' ? 'bg-green-100' : 'bg-red-100'}`}>
        <p className="text-lg font-semibold">Statut: {rapport.statut === 'coherent' ? (
          <span className="text-green-600 inline-flex items-center gap-1"><CheckCircle size={18} /> Donnees coherentes</span>
        ) : (
          <span className="text-red-600 inline-flex items-center gap-1"><XCircle size={18} /> Incoherences detectees</span>
        )}</p>
        <p className="text-sm text-gray-600">Derniere verification: {new Date(rapport.date_verification).toLocaleString('fr-FR')}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Clients PostgreSQL</p>
          <p className="text-2xl font-bold">{rapport.total_clients_pg}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">ICF MySQL (Scoring)</p>
          <p className="text-2xl font-bold">{rapport.total_clients_mysql}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">ICF Communs</p>
          <p className="text-2xl font-bold text-green-600">{rapport.icf_communs}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Incoherences</p>
          <p className="text-2xl font-bold text-red-600">{rapport.incoherences_detectees}</p>
        </div>
      </div>

      {rapport.incoherences.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Incoherences Detectees</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {rapport.incoherences.map((inc, i) => (
              <div key={i} className="p-4">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${inc.severite === 'erreur' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{inc.severite}</span>
                  <span className="text-xs text-gray-500">{inc.source}</span>
                </div>
                <p className="mt-1">{inc.description}</p>
                <p className="text-xs text-gray-400 mt-1">ICF: {inc.icf}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Detail par ICF</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ICF</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">PostgreSQL</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">MySQL</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">SQL Server</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Coherent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rapport.clients_incoherents.slice(0, 20).map((c, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{c.icf}</td>
                  <td className="px-4 py-3">{c.client_nom} {c.client_prenom}</td>
                  <td className="px-4 py-3 text-center">{c.present_postgres ? '✅' : '❌'}</td>
                  <td className="px-4 py-3 text-center">{c.present_mysql ? '✅' : '❌'}</td>
                  <td className="px-4 py-3 text-center">{c.present_mssql ? '✅' : '❌'}</td>
                  <td className="px-4 py-3 text-center">{c.coherent ? '✅' : '❌'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReconciliationPage;
