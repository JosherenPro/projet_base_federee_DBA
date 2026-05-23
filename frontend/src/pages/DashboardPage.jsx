import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LayoutDashboard, Users, CreditCard, TrendingUp, Building, AlertTriangle } from 'lucide-react';
import { getDashboard, getClientsRisqueEleve } from '../api';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import FormatCurrency from '../components/FormatCurrency';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const COLORS = ['#1e3a5f', '#c8a951', '#059669', '#dc2626', '#6366f1'];

const riskColors = {
  faible: 'green',
  moyen: 'yellow',
  eleve: 'orange',
  tres_eleve: 'red',
};

const statutColors = {
  en_cours: 'blue',
  approuve: 'green',
  rejete: 'red',
  cloture: 'gray',
};

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [clientsRisque, setClientsRisque] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, risqueRes] = await Promise.all([
          getDashboard(),
          getClientsRisqueEleve()
        ]);
        setDashboard(dashRes.data);
        setClientsRisque(risqueRes.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
  if (!dashboard) return null;

  const agenceData = dashboard.indicateurs_par_agence.map(a => ({
    name: a.agence_nom.replace('Agence ', ''),
    solde: a.solde_total_comptes,
    credits: a.volume_total_credits,
  }));

  const statutData = [
    { name: 'En cours', value: dashboard.indicateurs_par_agence.reduce((s, a) => s + a.nombre_credits_en_cours, 0) },
    { name: 'Approuves', value: dashboard.total_credits_approuves },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={Users} value={dashboard.total_comptes_actifs} label="Comptes actifs" color="blue" />
        <StatCard icon={TrendingUp} value={dashboard.solde_total_global} label="Solde total global" color="green" format="currency" />
        <StatCard icon={CreditCard} value={dashboard.total_credits_approuves} label="Credits approuves" color="yellow" />
        <StatCard icon={LayoutDashboard} value={dashboard.volume_total_credits} label="Volume credits" color="purple" format="currency" />
        <StatCard icon={Building} value={dashboard.nombre_agences} label="Agences" color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Solde par agence</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={agenceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => new Intl.NumberFormat('fr-FR').format(value) + ' XOF'} />
              <Bar dataKey="solde" fill="#1e3a5f" name="Solde total" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Credits par statut</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={statutData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
                {statutData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Resume par agence</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Agence</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Comptes</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Solde total</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Credits</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Volume credits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dashboard.indicateurs_par_agence.map((agence) => (
                  <tr key={agence.id_agence} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{agence.agence_nom}</td>
                    <td className="px-4 py-3 text-right">{agence.nombre_comptes_actifs}</td>
                    <td className="px-4 py-3 text-right"><FormatCurrency value={agence.solde_total_comptes} /></td>
                    <td className="px-4 py-3 text-right">{agence.nombre_credits_approuves}</td>
                    <td className="px-4 py-3 text-right"><FormatCurrency value={agence.volume_total_credits} /></td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-semibold">
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-right">{dashboard.total_comptes_actifs}</td>
                  <td className="px-4 py-3 text-right"><FormatCurrency value={dashboard.solde_total_global} /></td>
                  <td className="px-4 py-3 text-right">{dashboard.total_credits_approuves}</td>
                  <td className="px-4 py-3 text-right"><FormatCurrency value={dashboard.volume_total_credits} /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-500" />
            Clients a risque eleve
          </h2>
          <div className="space-y-3">
            {clientsRisque.slice(0, 5).map((client) => (
              <div key={client.id_client} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{client.nom} {client.prenom}</span>
                  <Badge text={client.niveau_risque} color={riskColors[client.niveau_risque]} size="sm" />
                </div>
                <p className="text-sm text-gray-500 mt-1">Score: {client.score}/100</p>
                <p className="text-xs text-gray-400">{client.agence_nom}</p>
              </div>
            ))}
            {clientsRisque.length === 0 && (
              <p className="text-gray-500 text-sm">Aucun client a risque eleve</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
