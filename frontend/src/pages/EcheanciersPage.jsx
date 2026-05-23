import React, { useState, useEffect } from 'react';
import { getCredits, getCreditEcheancier, updateEcheanceStatut } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge from '../components/Badge';
import FormatCurrency from '../components/FormatCurrency';

const EcheanciersPage = () => {
  const [credits, setCredits] = useState([]);
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [echeances, setEcheances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingEcheances, setLoadingEcheances] = useState(false);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const res = await getCredits({ page_size: 50 });
        setCredits(res.data.credits);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCredits();
  }, []);

  const loadEcheances = async (idDossier) => {
    setLoadingEcheances(true);
    try {
      const res = await getCreditEcheancier(idDossier);
      setEcheances(res.data.echeances);
      setSelectedCredit(credits.find(c => c.id_dossier === idDossier));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEcheances(false);
    }
  };

  const handleUpdateStatut = async (idEcheance, statut) => {
    try {
      await updateEcheanceStatut(selectedCredit.id_dossier, idEcheance, statut);
      loadEcheances(selectedCredit.id_dossier);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <LoadingSpinner />;

  const totalPaye = echeances.filter(e => e.statut_paiement === 'paid').length;
  const totalEnRetard = echeances.filter(e => e.statut_paiement === 'overdue').length;
  const totalRestant = echeances.filter(e => e.statut_paiement !== 'paid').reduce((sum, e) => sum + (e.montant_capital + e.montant_interet), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Gestion des Echeanciers</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Dossiers de Credit</h2>
          </div>
          <div className="overflow-y-auto max-h-96">
            {credits.map((c) => (
              <button
                key={c.id_dossier}
                onClick={() => loadEcheances(c.id_dossier)}
                className={`w-full text-left p-4 border-b hover:bg-gray-50 ${selectedCredit?.id_dossier === c.id_dossier ? 'bg-blue-50' : ''}`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Dossier #{c.id_dossier}</p>
                    <p className="text-sm text-gray-500">{c.client_nom} {c.client_prenom}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold"><FormatCurrency amount={c.montant_accorde} /></p>
                    <Badge status={c.statut_credit} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          {selectedCredit ? (
            <>
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Echeancier - Dossier #{selectedCredit.id_dossier}</h2>
                <p className="text-sm text-gray-500">{selectedCredit.client_nom} {selectedCredit.client_prenom}</p>
              </div>
              <div className="p-4 grid grid-cols-3 gap-4 border-b">
                <div>
                  <p className="text-sm text-gray-500">Payees</p>
                  <p className="text-xl font-bold text-green-600">{totalPaye}/{echeances.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">En retard</p>
                  <p className="text-xl font-bold text-red-600">{totalEnRetard}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Restant</p>
                  <p className="text-xl font-bold"><FormatCurrency amount={totalRestant} /></p>
                </div>
              </div>
              <div className="overflow-y-auto max-h-96">
                {loadingEcheances ? (
                  <div className="p-8"><LoadingSpinner /></div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Capital</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Interet</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {echeances.map((e) => (
                        <tr key={e.id_echeance} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm">{e.id_echeance}</td>
                          <td className="px-3 py-2 text-sm">{new Date(e.date_echeance).toLocaleDateString('fr-FR')}</td>
                          <td className="px-3 py-2 text-sm"><FormatCurrency amount={e.montant_capital} /></td>
                          <td className="px-3 py-2 text-sm"><FormatCurrency amount={e.montant_interet} /></td>
                          <td className="px-3 py-2"><Badge status={e.statut_paiement} /></td>
                          <td className="px-3 py-2">
                            {e.statut_paiement !== 'paid' && (
                              <button onClick={() => handleUpdateStatut(e.id_echeance, 'paid')} className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">
                                Marquer paye
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-gray-500">Selectionnez un dossier pour voir son echeancier</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EcheanciersPage;
