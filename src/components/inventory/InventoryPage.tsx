import React, { useState } from 'react';
import { Package, FileText, Filter, Search } from 'lucide-react';
import MaterialsTable from './MaterialsTable';
import InventoryRequestsList from './InventoryRequestsList';

const InventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'materials' | 'requests'>('materials');

  const tabs = [
    {
      id: 'materials',
      name: 'Materials Inventory',
      icon: Package,
      description: 'View and manage material inventory'
    },
    {
      id: 'requests',
      name: 'Maintenance Requests',
      icon: FileText,
      description: 'Review and process maintenance material requests'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Manage materials and process maintenance requests
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'materials' | 'requests')}
                  className={`
                    flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'materials' && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Materials Inventory
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  View and manage all materials in the inventory system
                </p>
              </div>
              <MaterialsTable />
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Maintenance Material Requests
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Review and process material requests from maintenance teams
                </p>
              </div>
              <InventoryRequestsList />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryPage; 