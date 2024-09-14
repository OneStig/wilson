import React from 'react';

interface HealthMetricProps {
  icon: string;
  title: string;
  value: string | number;
  unit: string;
  status: string;
  color: string;
}

export default function HealthMetric({ icon, title, value, unit, status, color }: HealthMetricProps) {
  const bgColor = `bg-${color}-100`;
  const iconColor = `text-${color}-500`;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md">
      <div className="flex items-center gap-2 mb-4">
        <div className={`${bgColor} p-2 rounded-lg`}>
          <span className={`${iconColor} text-2xl`}>{icon}</span>
        </div>
        <span className="text-lg font-semibold text-gray-800">{title}</span>
      </div>
      <div className="mb-2">
        <span className="text-4xl font-bold">{value}</span>
        <span className="text-lg text-gray-600 ml-1">{unit}</span>
      </div>
      <div className={`${bgColor} ${iconColor} text-sm font-medium px-2 py-1 rounded-full inline-block`}>
        {status}
      </div>
      <div className="h-16 mt-4 bg-gray-100 rounded-lg"></div>
    </div>
  );
}