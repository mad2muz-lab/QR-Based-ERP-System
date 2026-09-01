import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, FileText, CheckCircle, TrendingUp, Send, RotateCcw } from 'lucide-react';

const AccountsHub: React.FC = () => {
  const navigate = useNavigate();

  const cards = [
    { id: 'chart-of-accounts', label: 'Chart of Accounts', description: 'Manage your chart of accounts with bilingual names', icon: DollarSign, color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'hover:border-green-300', path: '/accounts/chart' },
    { id: 'general-ledger', label: 'General Ledger', description: 'View all journal entries and transactions', icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'hover:border-blue-300', path: '/accounts/ledger' },
    { id: 'reports', label: 'Financial Reports', description: 'Revenue, aging, and payment reports', icon: TrendingUp, color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'hover:border-purple-300', path: '/accounts/reports' },
    { id: 'zatca', label: 'ZATCA Compliance', description: 'E-invoicing compliance and XML generation', icon: CheckCircle, color: 'text-teal-600', bgColor: 'bg-teal-50', borderColor: 'hover:border-teal-300', path: '/accounts/zatca' },
    { id: 'zatca-tracking', label: 'ZATCA Tracking', description: 'Track ZATCA submission status', icon: Send, color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'hover:border-orange-300', path: '/accounts/zatca-tracking' },
    { id: 'credit-debit', label: 'Credit/Debit Notes', description: 'Create notes against invoices', icon: RotateCcw, color: 'text-rose-600', bgColor: 'bg-rose-50', borderColor: 'hover:border-rose-300', path: '/accounts/credit-debit-note' },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #059669, #047857)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign style={{ width: '24px', height: '24px', color: 'white' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Accounts</h1>
            <p style={{ fontSize: '16px', color: '#64748b', margin: 0 }}>Accounting, ledger, and compliance management</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              onClick={() => navigate(card.path)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '16px', padding: '28px', borderRadius: '16px', border: '2px solid #e2e8f0', background: 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
            >
              <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: card.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon style={{ width: '28px', height: '28px', color: card.color }} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 6px 0' }}>{card.label}</h3>
                <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>{card.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AccountsHub;
