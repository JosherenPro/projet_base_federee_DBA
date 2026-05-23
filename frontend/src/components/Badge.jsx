import React from 'react';

const colors = {
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  orange: 'bg-orange-100 text-orange-800',
  red: 'bg-red-100 text-red-800',
  gray: 'bg-gray-100 text-gray-800',
  blue: 'bg-blue-100 text-blue-800',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-2 text-base',
};

export default function Badge({ text, color = 'gray', size = 'md' }) {
  return (
    <span className={`inline-flex items-center font-medium rounded-full ${colors[color] || colors.gray} ${sizes[size]}`}>
      {text}
    </span>
  );
}
