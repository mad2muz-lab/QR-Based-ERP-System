import React from 'react';

interface SummaryRow {
  month: string;
  A: number;
  B: number;
  C: number;
  [key: string]: string | number;
}

interface UpcomingPreventiveMaintenanceSummaryProps {
  summary: SummaryRow[];
  onDrilldown: (classType: string, month: string) => void;
  getMonthLabel: (date: Date) => string;
}

const UpcomingPreventiveMaintenanceSummary: React.FC<UpcomingPreventiveMaintenanceSummaryProps> = ({ summary, onDrilldown, getMonthLabel }) => (
  <div className="bg-white rounded-lg shadow p-6 mb-6">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Preventive Maintenance Summary</h3>
    <div className="overflow-x-auto">
      <table className="min-w-full table-auto border">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-2 text-left">Month</th>
            <th className="px-4 py-2 text-left">Type A</th>
            <th className="px-4 py-2 text-left">Type B</th>
            <th className="px-4 py-2 text-left">Type C</th>
          </tr>
        </thead>
        <tbody>
          {summary.map(row => (
            <tr key={row.month} className="border-b">
              <td className="px-4 py-2">{getMonthLabel(new Date(row.month + '-01'))}</td>
              {['A', 'B', 'C'].map(cls => (
                <td key={cls} className="px-4 py-2">
                  <button
                    className="text-blue-600 underline hover:text-blue-800"
                    onClick={() => {
                      console.log('Drilldown button clicked:', cls, row.month, row[cls]);
                      onDrilldown(cls, row.month);
                    }}
                    disabled={row[cls] === 0}
                  >
                    {row[cls] || 0}
                  </button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default UpcomingPreventiveMaintenanceSummary; 