import React from 'react';

interface MetricBadgeProps {
  icon: string;
  title: string;
  value: number | string;
}

export default function MetricBadge({ icon, title, value }: MetricBadgeProps) {


  return (
    <div className="bg-white rounded-lg py-3 px-4 flex items-center gap-3 shadow-sm">
      <div className={`p-2 rounded-lg`}>
        <span className={` text-xl`}>{icon}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-sm text-gray-500">{title}</span>
        <span className="text-xl font-semibold">{value}</span>
      </div>
    </div>
  );
}