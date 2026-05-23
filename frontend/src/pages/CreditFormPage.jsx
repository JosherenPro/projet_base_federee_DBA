import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCredit } from '../api';

const CreditFormPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    montant_demande: '', duree_mois: '', taux: '', icf: '', id_agent: '1'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createCredit({
        ...formData,
        montant_demande: parseFloat(formData.montant_demande),
        duree_mois: parseInt(formData.duree_mois),
        taux: parseFloat(formData.taux),
        id_agent: parseInt(formData.id_agent)
      });
      navigate('/credits');
    } catch (err) {
      setError('Erreur lors de la creation du dossier de credit');
    } finally {
      setLoading(false);
    }
  };

  const mensualite = formData.montant_demande && formData.duree_mois && formData.taux
    ? (parseFloat(formData.montant_demande) * (parseFloat(formData.taux) / 100 / 12)) / (1 - Math.pow(1 + parseFloat(formData.taux) / 100 / 12, -parseInt(formData.duree_mois)))
    : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nouveau Dossier de Credit</h1>
      {error && <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">ICF Client *</label>
          <input type="text" value={formData.icf} onChange={(e) => setFormData({...formData, icf: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" placeholder="Identifiant client federe" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Montant demande (XOF) *</label>
            <input type="number" value={formData.montant_demande} onChange={(e) => setFormData({...formData, montant_demande: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Duree (mois) *</label>
            <input type="number" value={formData.duree_mois} onChange={(e) => setFormData({...formData, duree_mois: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Taux annuel (%) *</label>
            <input type="number" step="0.01" value={formData.taux} onChange={(e) => setFormData({...formData, taux: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Agent traitant *</label>
            <select value={formData.id_agent} onChange={(e) => setFormData({...formData, id_agent: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
              {[...Array(10)].map((_, i) => <option key={i+1} value={i+1}>Employe {i+1}</option>)}
            </select>
          </div>
        </div>
        {mensualite > 0 && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">Mensualite estimee: <span className="font-bold">{mensualite.toLocaleString('fr-FR', {maximumFractionDigits: 0})} XOF</span></p>
            <p className="text-sm text-blue-700 dark:text-blue-300">Cout total: <span className="font-bold">{(mensualite * parseInt(formData.duree_mois)).toLocaleString('fr-FR', {maximumFractionDigits: 0})} XOF</span></p>
          </div>
        )}
        <div className="flex gap-4 pt-4">
          <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Creation...' : 'Creer le dossier'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">Annuler</button>
        </div>
      </form>
    </div>
  );
};

export default CreditFormPage;
