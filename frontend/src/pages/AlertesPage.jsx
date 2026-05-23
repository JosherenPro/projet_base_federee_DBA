import React, { useState, useEffect } from 'react';
import { getAlertes, getResumeAlertes } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const AlertesPage = () => {
  const [alertes, setAlertes] = useState([]);
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [alertesRes, resumeRes] = await Promise.all([getAlertes(filter), getResumeAlertes()]);
      setAlertes(alertesRes.data.alertes);
      setResume(resumeRes.data);
    } catch (err) {
      setError('Erreur lors du chargement des alertes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filter]);

  if (loading && !resume) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;

  const getSeveriteColor = (severite) => {
    switch (severite) {
      case 'critique': return 'bg-red-100 text-red-800';
      case 'avertissement': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'solde_bas': return '💰';
      case 'echeance_retard': return '⏰';
      case 'transaction_suspecte': return '⚠️';
      default: return '🔔';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Alertes & Notifications</h1>
        <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Actualiser</button>
      </div>

      {resume && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Total Alertes</p>
            <p className="text-3xl font-bold">{resume.total_alertes}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Solde Bas</p>
            <p className="text-3xl font-bold text-yellow-600">{resume.alertes_solde_bas}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Echeances Retard</p>
            <p className="text-3xl font-bold text-orange-600">{resume.alertes_echeances_retard}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Transactions Suspectes</p>
            <p className="text-3xl font-bold text-red-600">{resume.alertes_transactions_suspectes}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Critiques</p>
            <p className="text-3xl font-bold text-red-700">{resume.alertes_critiques}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex gap-2">
          <button onClick={() => setFilter('')} className={`px-3 py-1 rounded ${!filter ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Toutes</button>
          <button onClick={() => setFilter('solde_bas')} className={`px-3 py-1 rounded ${filter === 'solde_bas' ? 'bg-yellow-600 text-white' : 'bg-gray-200'}`}>Solde Bas</button>
          <button onClick={() => setFilter('echeance_retard')} className={`px-3 py-1 rounded ${filter === 'echeance_retard' ? 'bg-orange-600 text-white' : 'bg-gray-200'}`}>Echeances Retard</button>
          <button onClick={() => setFilter('transaction_suspecte')} className={`px-3 py-1 rounded ${filter === 'transaction_suspecte' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}>Transactions Suspectes</button>
        </div>

        <div className="divide-y divide-gray-200">
          {alertes.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Aucune alerte</div>
          ) : (
            alertes.map((a, i) => (
              <div key={i} className="p-4 hover:bg-gray-50 flex items-start gap-3">
                <span className="text-2xl">{getTypeIcon(a.type)}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeveriteColor(a.severite)}`}>{a.severite}</span>
                    <span className="text-xs text-gray-500 capitalize">{a.type.replace('_', ' ')}</span>
                  </div>
                  <p className="mt-1">{a.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertesPage;
