import React from 'react';

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
      <p className="font-medium">Erreur: {message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
          Reessayer
        </button>
      )}
    </div>
  );
}
