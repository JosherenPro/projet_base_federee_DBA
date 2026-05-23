import React from 'react';
import FormatCurrency from './FormatCurrency';

export default function StatCard({ icon: Icon, value, label, color = 'blue', format = 'number' }) {
  const bgColors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${bgColors[color]}`}>
          <Icon size={24} />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {format === 'currency' ? <FormatCurrency value={value} /> : new Intl.NumberFormat('fr-FR').format(value)}
          </p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}
