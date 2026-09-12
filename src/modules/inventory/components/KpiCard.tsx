import React from 'react';

type KpiCardProps = {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  description: string; // explanation shown on hover
  type: 'lead' | 'lag';
};

export const KpiCard: React.FC<KpiCardProps> = ({ label, value, icon, description, type }) => (
                                <div className="relative group h-36 flex flex-col" aria-label={`${type} KPI: ${label}`}>
    {/* Tooltip */}
        <div className="hidden group-hover:block absolute z-20 w-64 max-w-xs p-2 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 rounded shadow-lg -top-12 left-1/2 transform -translate-x-1/2 whitespace-pre-line pointer-events-none">
      {description}
    </div>
      <div className="bg-white dark:bg-[#131B2A] rounded-2xl p-6 border border-slate-200/90 dark:border-[#202C3F] shadow-sm hover:shadow-md transition-all h-full flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
              {label}
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-2 whitespace-nowrap">{value}</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 shadow-sm">
            {icon}
          </div>
        </div>
      </div>
  </div>
);
