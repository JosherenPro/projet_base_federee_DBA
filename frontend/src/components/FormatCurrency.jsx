import React from 'react';

export default function FormatCurrency({ value, currency = 'XOF' }) {
  const formatted = new Intl.NumberFormat('fr-FR').format(Math.round(value || 0));
  return <span>{formatted} {currency}</span>;
}
