import React, { useState, useEffect } from 'react';
import { getFederationStatus, refreshMaterializedViews } from '../api';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function FederationPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await getFederationStatus();
      setStatus(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshMaterializedViews();
      await fetchStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchStatus} />;
  if (!status) return null;

  const foreignTables = [
    { name: 'fdw_dossier_credit', server: 'mysql_server', desc: 'Dossiers de credit' },
    { name: 'fdw_garantie', server: 'mysql_server', desc: 'Garanties' },
    { name: 'fdw_echeancier', server: 'mysql_server', desc: 'Echeanciers' },
    { name: 'fdw_scoring', server: 'mysql_server', desc: 'Scoring clients' },
    { name: 'fdw_ecriture_comptable', server: 'mssql_server', desc: 'Ecritures comptables' },
    { name: 'fdw_plan_comptable', server: 'mssql_server', desc: 'Plan comptable OHADA' },
    { name: 'fdw_bulletin_paie', server: 'mssql_server', desc: 'Bulletins de paie' },
    { name: 'fdw_operation_agence', server: 'mssql_server', desc: 'Operations d\'agence' },
  ];

  const views = [
    { name: 'vue_client_complet', desc: 'Profil client unifie avec score de risque' },
    { name: 'vue_credit_detail', desc: 'Detail complet des dossiers de credit' },
    { name: 'vue_operation_comptable', desc: 'Operations avec ecritures comptables' },
    { name: 'vue_tableau_bord', desc: 'Indicateurs cles par agence' },
  ];

  const mysqlStatus = status.federation?.mysql_server?.status || 'error';
  const mssqlStatus = status.federation?.mssql_server?.status || 'error';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Etat de la Federation</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#1e3a5f]/90 disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          Rafraichir les vues
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3">
            {mysqlStatus === 'connected' ? <CheckCircle className="text-green-500" /> : <XCircle className="text-red-500" />}
            <div>
              <h3 className="font-semibold">MySQL Server</h3>
              <p className="text-sm text-gray-500">Credits & Risque</p>
            </div>
          </div>
          <Badge text={mysqlStatus === 'connected' ? 'Connecte' : 'Erreur'} color={mysqlStatus === 'connected' ? 'green' : 'red'} size="md" />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3">
            {mssqlStatus === 'connected' ? <CheckCircle className="text-green-500" /> : <XCircle className="text-red-500" />}
            <div>
              <h3 className="font-semibold">SQL Server</h3>
              <p className="text-sm text-gray-500">Comptabilite & RH</p>
            </div>
          </div>
          <Badge text={mssqlStatus === 'connected' ? 'Connecte' : 'Erreur'} color={mssqlStatus === 'connected' ? 'green' : 'red'} size="md" />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-green-500" />
            <div>
              <h3 className="font-semibold">PostgreSQL Hub</h3>
              <p className="text-sm text-gray-500">Hub central</p>
            </div>
          </div>
          <Badge text="Connecte" color="green" size="md" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold mb-4">Foreign Tables (8 tables)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {foreignTables.map((table) => (
            <div key={table.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-mono text-sm">{table.name}</p>
                <p className="text-xs text-gray-500">{table.desc}</p>
              </div>
              <Badge text={table.server} color={table.server === 'mysql_server' ? 'blue' : 'purple'} size="sm" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold mb-4">Vues Federees (4 vues)</h2>
        <div className="space-y-3">
          {views.map((view) => (
            <div key={view.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-mono text-sm">{view.name}</p>
                <p className="text-xs text-gray-500">{view.desc}</p>
              </div>
              <Badge text="Active" color="green" size="sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
