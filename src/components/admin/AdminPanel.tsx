import React, { useState } from 'react';
import { User } from '../../types';
import DepartmentManager from './DepartmentManager';
import UnauthorizedAccess from '../common/UnauthorizedAccess';
import CompanyManager from './CompanyManager';
import AuditLogViewer from './AuditLogViewer';
import CostBreakdownManager from './CostBreakdownManager';
import UnitManagement from './UnitManagement';
import UserManagement from './components/UserManagement';
import EquipmentManagement from './components/EquipmentManagement';
import MaterialManagement from './components/MaterialManagement';
import TabContainer from './shared/TabContainer';


interface AdminPanelProps {
  currentUser?: User;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser }) => {
  // Check if user has admin access
  const hasAdminAccess = currentUser?.role === 'admin' || currentUser?.role === 'developer';
  
  if (!hasAdminAccess) {
    return <UnauthorizedAccess requiredRole="admin" />;
  }

  const [activeTab, setActiveTab] = useState<'users' | 'departments' | 'equipment' | 'materials' | 'companies' | 'auditlog' | 'costbreakdown' | 'units'>('users');

  const tabs = [
    { id: 'users', label: 'Users' },
    { id: 'departments', label: 'Departments' },
    { id: 'equipment', label: 'Equipment' },
    { id: 'materials', label: 'Materials' },
    { id: 'units', label: 'Unit Management' },
    { id: 'companies', label: 'Companies' },
    { id: 'costbreakdown', label: 'Cost Breakdown Structure' },
    { id: 'auditlog', label: 'Audit Log' },
  ];

  return (
    <div className="space-y-6">
      <TabContainer
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as typeof activeTab)}
      >

        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'equipment' && <EquipmentManagement />}
        {activeTab === 'materials' && <MaterialManagement />}
        {activeTab === 'departments' && <DepartmentManager />}
        {activeTab === 'companies' && <CompanyManager />}
        {activeTab === 'auditlog' && <AuditLogViewer />}
        {activeTab === 'costbreakdown' && <CostBreakdownManager />}
        {activeTab === 'units' && <UnitManagement />}

      </TabContainer>
    </div>
  );
};

export default AdminPanel;