import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { Activity, Server, Database, AlertTriangle, CheckCircle, XCircle, TrendingUp, Clock } from 'lucide-react';

const PROMETHEUS_URL = 'http://localhost:9090/api/v1';

const MonitoringPage = () => {
  const [metrics, setMetrics] = useState({});
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchMetric = async (query) => {
    try {
      const res = await fetch(`${PROMETHEUS_URL}/query?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      return data.data?.result || [];
    } catch {
      return [];
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [targetsRes, httpRate, latency, errors, dbConn, fdwStatus, dbDuration] = await Promise.all([
        fetch(`${PROMETHEUS_URL}/targets`),
        fetchMetric('rate(http_requests_total[5m])'),
        fetchMetric('histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) * 1000'),
        fetchMetric('rate(http_requests_total{status=~"5.."}[5m])'),
        fetchMetric('db_connections_active'),
        fetchMetric('fdw_connection_status'),
        fetchMetric('rate(db_query_duration_seconds_sum[5m]) / rate(db_query_duration_seconds_count[5m]) * 1000'),
      ]);

      const targetsData = await targetsRes.json();
      setTargets(targetsData.data?.activeTargets || []);

      const getValue = (results) => {
        if (!results.length) return 'N/A';
        const val = parseFloat(results[0].value?.[1]);
        return isNaN(val) ? 'N/A' : val.toFixed(2);
      };

      const getMultiValue = (results) => {
        return results.map(r => ({
          name: r.metric?.database || r.metric?.server || r.metric?.handler || 'unknown',
          value: parseFloat(r.value?.[1]) || 0
        }));
      };

      setMetrics({
        httpRate: getMultiValue(httpRate),
        latency: getValue(latency),
        errors: getValue(errors),
        dbConnections: getMultiValue(dbConn),
        fdwStatus: getMultiValue(fdwStatus),
        dbDuration: getMultiValue(dbDuration),
      });

      setLastUpdate(new Date());
    } catch (err) {
      setError('Impossible de joindre Prometheus. Verifiez que le service est actif sur le port 9090.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !lastUpdate) return <LoadingSpinner />;
  if (error && !lastUpdate) return <ErrorMessage message={error} onRetry={fetchData} />;

  const targetStatus = targets.reduce((acc, t) => {
    acc[t.health] = (acc[t.health] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monitoring Prometheus</h1>
          <p className="text-sm text-gray-500 mt-1">
            {lastUpdate && `Derniere actualisation: ${lastUpdate.toLocaleTimeString('fr-FR')}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Activity size={16} /> Actualiser
          </button>
        </div>
      </div>

      {/* Target Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Server size={20} />
          Targets Prometheus
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-500">UP</p>
            <p className="text-2xl font-bold text-green-600">{targetStatus.up || 0}</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-gray-500">DOWN</p>
            <p className="text-2xl font-bold text-red-600">{targetStatus.down || 0}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-500">Total Targets</p>
            <p className="text-2xl font-bold text-blue-600">{targets.length}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Scrape Interval</p>
            <p className="text-2xl font-bold">15s</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {targets.map((t, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center gap-3">
                {t.health === 'up' ? <CheckCircle size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-500" />}
                <span className="font-mono text-sm">{t.labels.job}</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${t.health === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {t.health}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* API Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={20} />
            Requêtes HTTP/s
          </h2>
          {metrics.httpRate.length === 0 ? (
            <p className="text-gray-500">Aucune donnee</p>
          ) : (
            <div className="space-y-3">
              {metrics.httpRate.map((m, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-mono text-sm">{m.name}</span>
                  <span className="font-bold">{m.value.toFixed(3)} req/s</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock size={20} />
            Latence p95
          </h2>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold">{metrics.latency} ms</p>
            <p className="text-sm text-gray-500 mt-1">Percentile 95 sur 5 minutes</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle size={20} />
            Erreurs 5xx/s
          </h2>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold">{metrics.errors} req/s</p>
            <p className="text-sm text-gray-500 mt-1">Taux d'erreurs serveur</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Database size={20} />
            Connexions DB
          </h2>
          {metrics.dbConnections.length === 0 ? (
            <p className="text-gray-500">Aucune donnee</p>
          ) : (
            <div className="space-y-3">
              {metrics.dbConnections.map((m, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-mono text-sm">{m.name}</span>
                  <span className="font-bold">{m.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FDW Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Server size={20} />
          Statut FDW
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {metrics.fdwStatus.map((m, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
              <span className="font-mono">{m.name}</span>
              {m.value === 1 ? (
                <span className="flex items-center gap-1 text-green-600 font-semibold"><CheckCircle size={16} /> UP</span>
              ) : (
                <span className="flex items-center gap-1 text-red-600 font-semibold"><XCircle size={16} /> DOWN</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* DB Query Duration */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock size={20} />
          Duree moyenne des requetes DB
        </h2>
        {metrics.dbDuration.length === 0 ? (
          <p className="text-gray-500">Aucune donnee</p>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {metrics.dbDuration.map((m, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">{m.name}</p>
                <p className="text-2xl font-bold">{m.value.toFixed(1)} ms</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MonitoringPage;
