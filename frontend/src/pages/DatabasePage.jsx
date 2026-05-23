import React, { useState, useEffect } from 'react';
import { getDatabaseInfo, getMysqlInfo, getMssqlInfo, executeQuery, refreshViews } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { Database, Table, Eye, RefreshCw, Play, AlertCircle, CheckCircle, Activity } from 'lucide-react';

const DatabasePage = () => {
  const [pgInfo, setPgInfo] = useState(null);
  const [mysqlInfo, setMysqlInfo] = useState(null);
  const [mssqlInfo, setMssqlInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [queryDb, setQueryDb] = useState('postgresql');
  const [queryText, setQueryText] = useState('SELECT * FROM client LIMIT 10');
  const [queryResult, setQueryResult] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pgRes, mysqlRes, mssqlRes] = await Promise.all([
        getDatabaseInfo(),
        getMysqlInfo(),
        getMssqlInfo()
      ]);
      setPgInfo(pgRes.data);
      setMysqlInfo(mysqlRes.data);
      setMssqlInfo(mssqlRes.data);
    } catch (err) {
      setError('Erreur lors du chargement des informations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleExecuteQuery = async () => {
    setQueryLoading(true);
    setQueryError(null);
    setQueryResult(null);
    try {
      const res = await executeQuery(queryDb, { query: queryText, limit: 100 });
      if (res.data.error) {
        setQueryError(res.data.error);
      } else {
        setQueryResult(res.data);
      }
    } catch (err) {
      setQueryError(err.response?.data?.detail || 'Erreur execution requete');
    } finally {
      setQueryLoading(false);
    }
  };

  const handleRefreshViews = async () => {
    setRefreshing(true);
    try {
      await refreshViews();
      fetchData();
    } catch (err) {
      setError('Erreur lors de l\'actualisation des vues');
    } finally {
      setRefreshing(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return 'N/A';
    const mb = bytes / 1024 / 1024;
    if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
    return `${mb.toFixed(2)} MB`;
  };

  const formatUptime = (seconds) => {
    if (!seconds) return 'N/A';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Bases de Donnees</h1>
        <div className="flex gap-2">
          <button onClick={handleRefreshViews} disabled={refreshing} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Actualisation...' : 'Actualiser Vues'}
          </button>
          <button onClick={fetchData} className="px-4 py-2 border rounded-lg hover:bg-gray-100 flex items-center gap-2">
            <RefreshCw size={16} /> Rafraichir
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b">
        {[
          { id: 'overview', label: 'Vue d\'ensemble' },
          { id: 'postgres', label: 'PostgreSQL Hub' },
          { id: 'mysql', label: 'MySQL Credits' },
          { id: 'mssql', label: 'SQL Server Compta' },
          { id: 'query', label: 'Executer Requete' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 ${activeTab === tab.id ? 'border-b-2 border-blue-600 font-semibold text-blue-600' : 'text-gray-500'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
              <div className="flex items-center gap-3 mb-4">
                <Database className="text-blue-500" size={24} />
                <h2 className="text-lg font-semibold">PostgreSQL Hub</h2>
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">Version:</span> {pgInfo?.version?.version?.substring(0, 50) || 'N/A'}</p>
                <p><span className="text-gray-500">Taille:</span> {pgInfo?.db_size?.size_pretty || formatSize(pgInfo?.db_size?.size_bytes)}</p>
                <p><span className="text-gray-500">Tables:</span> {pgInfo?.table_count?.count || 0}</p>
                <p><span className="text-gray-500">Vues:</span> {pgInfo?.view_count?.count || 0}</p>
                <p><span className="text-gray-500">Foreign Tables:</span> {pgInfo?.foreign_table_count?.count || 0}</p>
                <p><span className="text-gray-500">Connexions:</span> {pgInfo?.connection_count?.count || 0}</p>
                <p><span className="text-gray-500">Cache Hit:</span> {pgInfo?.cache_hit_ratio?.ratio || 'N/A'}%</p>
                <p><span className="text-gray-500">Uptime:</span> {formatUptime(pgInfo?.uptime?.uptime_seconds)}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-orange-500">
              <div className="flex items-center gap-3 mb-4">
                <Database className="text-orange-500" size={24} />
                <h2 className="text-lg font-semibold">MySQL Credits</h2>
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">Version:</span> {mysqlInfo?.version?.version || 'N/A'}</p>
                <p><span className="text-gray-500">Taille:</span> {formatSize(mysqlInfo?.db_size?.size_bytes)}</p>
                <p><span className="text-gray-500">Tables:</span> {mysqlInfo?.table_count?.count || 0}</p>
                <p><span className="text-gray-500">Connexions:</span> {mysqlInfo?.connection_count?.count || 0}</p>
                <p><span className="text-gray-500">Uptime:</span> {formatUptime(mysqlInfo?.uptime?.uptime_seconds)}</p>
                <p><span className="text-gray-500">Triggers:</span> {mysqlInfo?.triggers?.length || 0}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
              <div className="flex items-center gap-3 mb-4">
                <Database className="text-red-500" size={24} />
                <h2 className="text-lg font-semibold">SQL Server Compta</h2>
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">Foreign Tables:</span> {mssqlInfo?.total_foreign_tables || 0}</p>
                <p><span className="text-gray-500">Ecritures:</span> {mssqlInfo?.ecriture_comptable?.row_count || 0}</p>
                <p><span className="text-gray-500">Plan Comptable:</span> {mssqlInfo?.plan_comptable?.row_count || 0}</p>
                <p><span className="text-gray-500">Bulletins Paie:</span> {mssqlInfo?.bulletin_paie?.row_count || 0}</p>
                <p><span className="text-gray-500">Operations:</span> {mssqlInfo?.operation_agence?.row_count || 0}</p>
              </div>
            </div>
          </div>

          {pgInfo?.materialized_views && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Vues Materialisees</h2>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Peuplee</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pgInfo.materialized_views.map((v, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2 font-mono text-sm">{v.matviewname}</td>
                      <td className="px-4 py-2">
                        {v.ispopulated ? (
                          <span className="text-green-600 flex items-center gap-1"><CheckCircle size={14} /> Oui</span>
                        ) : (
                          <span className="text-red-600 flex items-center gap-1"><AlertCircle size={14} /> Non</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'postgres' && pgInfo && (
        <div className="space-y-6">
          {pgInfo.tables && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b flex items-center gap-2">
                <Table size={20} />
                <h2 className="text-lg font-semibold">Tables ({pgInfo.tables.length})</h2>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Schema</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Lignes</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Taille</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dernier Vacuum</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dernier Analyze</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pgInfo.tables.map((t, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-sm">{t.table_name}</td>
                      <td className="px-4 py-2 text-sm">{t.schemaname}</td>
                      <td className="px-4 py-2 text-sm">{t.row_count?.toLocaleString()}</td>
                      <td className="px-4 py-2 text-sm">{t.total_size}</td>
                      <td className="px-4 py-2 text-sm">{t.last_vacuum ? new Date(t.last_vacuum).toLocaleDateString('fr-FR') : '-'}</td>
                      <td className="px-4 py-2 text-sm">{t.last_analyze ? new Date(t.last_analyze).toLocaleDateString('fr-FR') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pgInfo.views && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b flex items-center gap-2">
                <Eye size={20} />
                <h2 className="text-lg font-semibold">Vues ({pgInfo.views.length})</h2>
              </div>
              <div className="divide-y max-h-96 overflow-y-auto">
                {pgInfo.views.map((v, i) => (
                  <div key={i} className="p-4">
                    <p className="font-mono text-sm font-semibold">{v.viewname}</p>
                    <p className="text-xs text-gray-500 mt-1 font-mono truncate">{v.definition}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'mysql' && mysqlInfo && (
        <div className="space-y-6">
          {mysqlInfo.tables && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b flex items-center gap-2">
                <Table size={20} />
                <h2 className="text-lg font-semibold">Tables MySQL ({mysqlInfo.tables.length})</h2>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Engine</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Lignes</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Taille (MB)</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Creee le</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {mysqlInfo.tables.map((t, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-sm">{t.table_name}</td>
                      <td className="px-4 py-2 text-sm">{t.engine}</td>
                      <td className="px-4 py-2 text-sm">{t.row_count?.toLocaleString()}</td>
                      <td className="px-4 py-2 text-sm">{t.size_mb}</td>
                      <td className="px-4 py-2 text-sm">{t.create_time ? new Date(t.create_time).toLocaleDateString('fr-FR') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {mysqlInfo.triggers && mysqlInfo.triggers.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b flex items-center gap-2">
                <Activity size={20} />
                <h2 className="text-lg font-semibold">Triggers ({mysqlInfo.triggers.length})</h2>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Trigger</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Evenement</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Timing</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {mysqlInfo.triggers.map((t, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-sm">{t.trigger_name}</td>
                      <td className="px-4 py-2 text-sm">{t.event_manipulation}</td>
                      <td className="px-4 py-2 text-sm">{t.event_object_table}</td>
                      <td className="px-4 py-2 text-sm">{t.action_timing}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'mssql' && mssqlInfo && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">SQL Server - Tables via FDW</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Lignes</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {Object.entries(mssqlInfo).filter(([k]) => k !== 'total_foreign_tables').map(([name, data]) => (
                <tr key={name} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-sm">{name}</td>
                  <td className="px-4 py-2 text-sm">{data.row_count?.toLocaleString() || 0}</td>
                  <td className="px-4 py-2">
                    {data.error ? (
                      <span className="text-red-600 flex items-center gap-1"><AlertCircle size={14} /> Erreur</span>
                    ) : (
                      <span className="text-green-600 flex items-center gap-1"><CheckCircle size={14} /> OK</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'query' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex gap-4 mb-4">
              <select value={queryDb} onChange={(e) => setQueryDb(e.target.value)} className="p-2 border rounded">
                <option value="postgresql">PostgreSQL Hub</option>
                <option value="mysql">MySQL Credits</option>
              </select>
              <button onClick={handleExecuteQuery} disabled={queryLoading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                <Play size={16} />
                {queryLoading ? 'Execution...' : 'Executer'}
              </button>
            </div>
            <textarea
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              className="w-full p-3 border rounded font-mono text-sm h-32"
              placeholder="SELECT * FROM client LIMIT 10"
            />
            <p className="text-xs text-gray-500 mt-1">Seules les requetes SELECT sont autorisees (mode lecture seule)</p>
          </div>

          {queryError && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <p className="text-red-700 font-mono text-sm">{queryError}</p>
            </div>
          )}

          {queryResult && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b">
                <p className="text-sm text-gray-500">{queryResult.count} lignes retournees</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {queryResult.columns.map((col, i) => (
                        <th key={i} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {queryResult.rows.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {queryResult.columns.map((col, j) => (
                          <td key={j} className="px-4 py-2 text-sm font-mono">{row[col] !== null ? String(row[col]) : 'NULL'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DatabasePage;
