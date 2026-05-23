import React, { useState, useEffect } from 'react';
import { getCredits } from '../api';
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

export default function CreditsPage() {
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statutFilter, setStatutFilter] = useState('');
  const pageSize = 20;

  const fetchCredits = async () => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize };
      if (statutFilter) params.statut = statutFilter;
      const res = await getCredits(params);
      setCredits(res.data.credits);
      setTotal(res.data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, [page, statutFilter]);

  if (loading && credits.length === 0) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchCredits} />;

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Credits</h1>

      <div className="flex gap-4">
        <select
          value={statutFilter}
          onChange={(e) => { setStatutFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">Tous les statuts</option>
          <option value="en_cours">En cours</option>
          <option value="approuve">Approuve</option>
          <option value="rejete">Rejete</option>
          <option value="cloture">Cloture</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Client</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Montant demande</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Montant accorde</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Duree</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Taux</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Statut</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Garanties</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Ech. impayees</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {credits.map((credit) => (
                <tr key={credit.id_dossier} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono">{credit.id_dossier}</td>
                  <td className="px-4 py-3">{credit.client_nom} {credit.client_prenom}</td>
                  <td className="px-4 py-3 text-right"><FormatCurrency value={credit.montant_demande} /></td>
                  <td className="px-4 py-3 text-right">{credit.montant_accorde ? <FormatCurrency value={credit.montant_accorde} /> : '-'}</td>
                  <td className="px-4 py-3 text-center">{credit.duree_mois} mois</td>
                  <td className="px-4 py-3 text-center">{credit.taux}%</td>
                  <td className="px-4 py-3 text-center">
                    <Badge text={credit.statut_credit} color={statutColors[credit.statut_credit]} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-right">{credit.nombre_garanties}</td>
                  <td className="px-4 py-3 text-right">{credit.nombre_echeances_impayees}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">{total} dossier(s)</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-50">Prec.</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 border rounded disabled:opacity-50">Suiv.</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
