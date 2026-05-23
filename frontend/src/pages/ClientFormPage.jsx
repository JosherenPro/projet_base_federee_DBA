import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '../api';

const ClientFormPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nom: '', prenom: '', date_naissance: '', numero_piece: '',
    telephone: '', email: '', adresse: '', id_agence: '1'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createClient({ ...formData, id_agence: parseInt(formData.id_agence) });
      navigate('/clients');
    } catch (err) {
      setError('Erreur lors de la creation du client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nouveau Client</h1>
      {error && <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom *</label>
            <input type="text" value={formData.nom} onChange={(e) => setFormData({...formData, nom: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Prenom *</label>
            <input type="text" value={formData.prenom} onChange={(e) => setFormData({...formData, prenom: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date de naissance *</label>
          <input type="date" value={formData.date_naissance} onChange={(e) => setFormData({...formData, date_naissance: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Numero piece d'identite *</label>
          <input type="text" value={formData.numero_piece} onChange={(e) => setFormData({...formData, numero_piece: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Telephone *</label>
            <input type="tel" value={formData.telephone} onChange={(e) => setFormData({...formData, telephone: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Adresse</label>
          <input type="text" value={formData.adresse} onChange={(e) => setFormData({...formData, adresse: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Agence de rattachement *</label>
          <select value={formData.id_agence} onChange={(e) => setFormData({...formData, id_agence: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
            <option value="1">Agence Principale Lome</option>
            <option value="2">Agence Kpalime</option>
            <option value="3">Agence Sokode</option>
            <option value="4">Agence Kara</option>
            <option value="5">Agence Dapaong</option>
          </select>
        </div>
        <div className="flex gap-4 pt-4">
          <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Creation...' : 'Creer le client'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">Annuler</button>
        </div>
      </form>
    </div>
  );
};

export default ClientFormPage;
