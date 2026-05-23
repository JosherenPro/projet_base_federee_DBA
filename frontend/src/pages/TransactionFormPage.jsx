import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTransaction } from '../api';

const TransactionFormPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    type_operation: 'virement', montant: '', devise: 'XOF',
    id_compte_source: '', id_compte_dest: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = {
        ...formData,
        montant: parseFloat(formData.montant),
        id_compte_source: formData.id_compte_source ? parseInt(formData.id_compte_source) : null,
        id_compte_dest: formData.id_compte_dest ? parseInt(formData.id_compte_dest) : null
      };
      if (data.type_operation === 'depot' && !data.id_compte_dest) {
        setError('Un compte destination est requis pour un depot');
        setLoading(false);
        return;
      }
      if (data.type_operation === 'retrait' && !data.id_compte_source) {
        setError('Un compte source est requis pour un retrait');
        setLoading(false);
        return;
      }
      await createTransaction(data);
      navigate('/operations');
    } catch (err) {
      setError('Erreur lors de la creation de la transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nouvelle Transaction</h1>
      {error && <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Type d'operation *</label>
          <select value={formData.type_operation} onChange={(e) => setFormData({...formData, type_operation: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
            <option value="virement">Virement</option>
            <option value="depot">Depot</option>
            <option value="retrait">Retrait</option>
            <option value="prelevement">Prelevement</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Montant (XOF) *</label>
            <input type="number" value={formData.montant} onChange={(e) => setFormData({...formData, montant: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Devise</label>
            <select value={formData.devise} onChange={(e) => setFormData({...formData, devise: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
              <option value="XOF">XOF</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
        {formData.type_operation !== 'depot' && (
          <div>
            <label className="block text-sm font-medium mb-1">Compte source *</label>
            <input type="number" value={formData.id_compte_source} onChange={(e) => setFormData({...formData, id_compte_source: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
          </div>
        )}
        {formData.type_operation !== 'retrait' && (
          <div>
            <label className="block text-sm font-medium mb-1">Compte destination *</label>
            <input type="number" value={formData.id_compte_dest} onChange={(e) => setFormData({...formData, id_compte_dest: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
          </div>
        )}
        <div className="flex gap-4 pt-4">
          <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Creation...' : 'Creer la transaction'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">Annuler</button>
        </div>
      </form>
    </div>
  );
};

export default TransactionFormPage;
