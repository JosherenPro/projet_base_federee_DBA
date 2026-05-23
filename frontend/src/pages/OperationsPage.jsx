import React, { useState, useEffect } from 'react';
import { getOperations } from '../api';
import FormatCurrency from '../components/FormatCurrency';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function OperationsPage() {
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState('');
  const pageSize = 20;

  const fetchOperations = async () => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize };
      if (typeFilter) params.type_operation = typeFilter;
      const res = await getOperations(params);
      setOperations(res.data.operations);
      setTotal(res.data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperations();
  }, [page, typeFilter]);

  if (loading && operations.length === 0) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={fetchOperations} />;

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Operations</h1>

      <div className="flex gap-4">
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">Tous les types</option>
          <option value="virement">Virement</option>
          <option value="retrait">Retrait</option>
          <option value="depot">Depot</option>
          <option value="prelevement">Prelevement</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Type</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Montant</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Compte source</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Compte dest.</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Journal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {operations.map((op) => (
                <tr key={op.id_transaction} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono">{op.id_transaction}</td>
                  <td className="px-4 py-3 capitalize">{op.type_operation}</td>
                  <td className="px-4 py-3 text-right"><FormatCurrency value={op.montant} /></td>
                  <td className="px-4 py-3">{new Date(op.date_heure).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3">{op.type_compte_source || '-'}</td>
                  <td className="px-4 py-3">{op.type_compte_dest || '-'}</td>
                  <td className="px-4 py-3">{op.journal || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">{total} operation(s)</span>
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
