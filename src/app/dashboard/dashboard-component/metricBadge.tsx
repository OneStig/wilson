import React from 'react';

interface MetricBadgeProps {
  icon: string;
  title: string;
  value: number | string;
  color: string;
}

export default function MetricBadge({ icon, title, value, color }: MetricBadgeProps) {
  const bgColor = `bg-${color}-100`;
  const iconColor = `text-${color}-500`;

  return (
    <div className="bg-white rounded-lg py-2 px-4 flex items-center gap-3 shadow-sm">
      <div className={`${bgColor} p-2 rounded-lg flex items-center justify-center`}>
        <span className={`${iconColor} text-3xl`}>{icon}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-base text-gray-500">{title}</span>
        <span className="text-2xl text-gray-700 font-semibold">{value}</span>
      </div>
    </div>
  );
}