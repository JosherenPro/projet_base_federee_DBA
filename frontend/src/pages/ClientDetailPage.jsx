import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, CreditCard, Building, AlertTriangle, TrendingUp, Mail, Phone, MapPin, Calendar, FileText } from 'lucide-react';
import { getClientByICF, getCredits } from '../api';
import StatCard from '../components/StatCard';
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

const statutColors = {
  en_cours: 'blue',
  approuve: 'green',
  rejete: 'red',
  cloture: 'gray',
};

export default function ClientDetailPage() {
  const { icf } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientRes, creditsRes] = await Promise.all([
          getClientByICF(icf),
          getCredits({ page_size: 100 })
        ]);
        setClient(clientRes.data);
        const clientCredits = creditsRes.data.credits.filter(c => c.icf === icf);
        setCredits(clientCredits);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [icf]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={() => navigate(-1)} />;
  if (!client) return <div className="text-center py-12 text-gray-500">Client non trouve</div>;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
        <ArrowLeft size={20} />
        <span>Retour</span>
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{client.nom} {client.prenom}</h1>
          <p className="text-gray-500 mt-1">ICF: {client.icf?.substring(0, 16)}...</p>
        </div>
        <Badge text={client.niveau_risque} color={riskColors[client.niveau_risque]} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} value={client.nombre_comptes} label="Nombre de comptes" color="blue" />
        <StatCard icon={TrendingUp} value={client.solde_total} label="Solde total" color="green" format="currency" />
        <StatCard icon={CreditCard} value={credits.length} label="Dossiers de credit" color="yellow" />
        <StatCard icon={AlertTriangle} value={client.score_risque} label="Score de risque" color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Informations personnelles</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Calendar size={16} className="text-gray-400" />
              <span className="text-gray-500">Date de naissance:</span>
              <span className="font-medium">{client.date_naissance}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone size={16} className="text-gray-400" />
              <span className="text-gray-500">Telephone:</span>
              <span className="font-medium">{client.telephone}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail size={16} className="text-gray-400" />
              <span className="text-gray-500">Email:</span>
              <span className="font-medium">{client.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin size={16} className="text-gray-400" />
              <span className="text-gray-500">Adresse:</span>
              <span className="font-medium">{client.adresse}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Building size={16} className="text-gray-400" />
              <span className="text-gray-500">Agence:</span>
              <span className="font-medium">{client.agence_nom} ({client.agence_ville})</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Detail des soldes</h2>
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600">Solde compte courant</p>
              <p className="text-xl font-bold text-blue-900"><FormatCurrency value={client.solde_courant} /></p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600">Solde compte epargne</p>
              <p className="text-xl font-bold text-green-900"><FormatCurrency value={client.solde_epargne} /></p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-600">Solde total</p>
              <p className="text-xl font-bold text-purple-900"><FormatCurrency value={client.solde_total} /></p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Evaluation du risque</h2>
          <div className="text-center">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={client.score_risque > 75 ? '#059669' : client.score_risque > 50 ? '#c8a951' : client.score_risque > 25 ? '#dc2626' : '#991b1b'} strokeWidth="3" strokeDasharray={`${client.score_risque}, 100`} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{client.score_risque}</span>
              </div>
            </div>
            <Badge text={client.niveau_risque} color={riskColors[client.niveau_risque]} size="lg" />
            {client.date_dernier_scoring && (
              <p className="text-xs text-gray-400 mt-2">Dernier scoring: {new Date(client.date_dernier_scoring).toLocaleDateString('fr-FR')}</p>
            )}
          </div>
        </div>
      </div>

      {credits.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CreditCard size={20} />
            Dossiers de credit ({credits.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">ID</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Montant demande</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">Montant accorde</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-500">Duree</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-500">Taux</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-500">Statut</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Date soumission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {credits.map((credit) => (
                  <tr key={credit.id_dossier} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/credits/${credit.id_dossier}`)}>
                    <td className="px-4 py-3 font-medium">#{credit.id_dossier}</td>
                    <td className="px-4 py-3 text-right"><FormatCurrency value={credit.montant_demande} /></td>
                    <td className="px-4 py-3 text-right">{credit.montant_accorde ? <FormatCurrency value={credit.montant_accorde} /> : '-'}</td>
                    <td className="px-4 py-3 text-center">{credit.duree_mois} mois</td>
                    <td className="px-4 py-3 text-center">{credit.taux}%</td>
                    <td className="px-4 py-3 text-center"><Badge text={credit.statut_credit} color={statutColors[credit.statut_credit]} /></td>
                    <td className="px-4 py-3">{credit.date_soumission ? new Date(credit.date_soumission).toLocaleDateString('fr-FR') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
