import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Shield, Calendar, Percent, DollarSign, FileText, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { getCreditById, getClientByICF } from '../api';
import Badge from '../components/Badge';
import FormatCurrency from '../components/FormatCurrency';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const statutColors = {
  en_cours: 'blue',
  approuve: 'green',
  rejete: 'red',
  cloture: 'gray',
};

const statutIcons = {
  en_cours: Clock,
  approuve: CheckCircle,
  rejete: XCircle,
  cloture: FileText,
};

export default function CreditDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [credit, setCredit] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const creditRes = await getCreditById(id);
        setCredit(creditRes.data);
        if (creditRes.data.icf) {
          try {
            const clientRes = await getClientByICF(creditRes.data.icf);
            setClient(clientRes.data);
          } catch {
            // Client not found, continue without client info
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={() => navigate(-1)} />;
  if (!credit) return <div className="text-center py-12 text-gray-500">Credit non trouve</div>;

  const StatutIcon = statutIcons[credit.statut_credit] || FileText;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
        <ArrowLeft size={20} />
        <span>Retour</span>
      </button>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Dossier #{credit.id_dossier}</h1>
            <Badge text={credit.statut_credit} color={statutColors[credit.statut_credit]} />
          </div>
          {client && (
            <p className="text-gray-500 mt-1">
              Client: {client.nom} {client.prenom}
            </p>
          )}
        </div>
        <StatutIcon size={32} className={
          credit.statut_credit === 'approuve' ? 'text-green-500' :
          credit.statut_credit === 'rejete' ? 'text-red-500' :
          credit.statut_credit === 'cloture' ? 'text-gray-500' : 'text-blue-500'
        } />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3">
            <DollarSign size={24} className="text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">Montant demande</p>
              <p className="text-xl font-bold"><FormatCurrency value={credit.montant_demande} /></p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3">
            <CheckCircle size={24} className="text-green-500" />
            <div>
              <p className="text-sm text-gray-500">Montant accorde</p>
              <p className="text-xl font-bold">{credit.montant_accorde ? <FormatCurrency value={credit.montant_accorde} /> : '-'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3">
            <Calendar size={24} className="text-purple-500" />
            <div>
              <p className="text-sm text-gray-500">Duree</p>
              <p className="text-xl font-bold">{credit.duree_mois} mois</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-3">
            <Percent size={24} className="text-yellow-500" />
            <div>
              <p className="text-sm text-gray-500">Taux d'interet</p>
              <p className="text-xl font-bold">{credit.taux}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Informations du dossier</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Date de soumission</span>
              <span className="font-medium">{credit.date_soumission ? new Date(credit.date_soumission).toLocaleDateString('fr-FR') : '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Date de decision</span>
              <span className="font-medium">{credit.date_decision ? new Date(credit.date_decision).toLocaleDateString('fr-FR') : '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">ID Agent</span>
              <span className="font-medium">{credit.id_agent || '-'}</span>
            </div>
            {credit.motif_rejet && (
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle size={16} />
                  <span className="font-medium">Motif de rejet</span>
                </div>
                <p className="text-sm text-red-600 mt-1">{credit.motif_rejet}</p>
              </div>
            )}
          </div>
        </div>

        {credit.montant_accorde && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold mb-4">Simulation mensualite</h2>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600">Mensualite estimee</p>
                <p className="text-2xl font-bold text-blue-900">
                  <FormatCurrency value={
                    (credit.montant_accorde * (credit.taux / 100 / 12) * Math.pow(1 + credit.taux / 100 / 12, credit.duree_mois)) /
                    (Math.pow(1 + credit.taux / 100 / 12, credit.duree_mois) - 1)
                  } />
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600">Cout total du credit</p>
                <p className="text-xl font-bold text-green-900">
                  <FormatCurrency value={
                    ((credit.montant_accorde * (credit.taux / 100 / 12) * Math.pow(1 + credit.taux / 100 / 12, credit.duree_mois)) /
                    (Math.pow(1 + credit.taux / 100 / 12, credit.duree_mois) - 1)) * credit.duree_mois
                  } />
                </p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-600">Cout des interets</p>
                <p className="text-xl font-bold text-yellow-900">
                  <FormatCurrency value={
                    (((credit.montant_accorde * (credit.taux / 100 / 12) * Math.pow(1 + credit.taux / 100 / 12, credit.duree_mois)) /
                    (Math.pow(1 + credit.taux / 100 / 12, credit.duree_mois) - 1)) * credit.duree_mois) - credit.montant_accorde
                  } />
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {credit.garanties && credit.garanties.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield size={20} />
            Garanties ({credit.garanties.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {credit.garanties.map((g, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">{g.type_garantie}</p>
                <p className="text-lg font-bold text-green-600 mt-1"><FormatCurrency value={g.valeur_estimee} /></p>
                {g.description && <p className="text-sm text-gray-500 mt-1">{g.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
