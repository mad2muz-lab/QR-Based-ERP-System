import React from 'react';

interface Tab {
  id: string;
  label: string;
}

interface TabContainerProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
}

const TabContainer: React.FC<TabContainerProps> = ({ tabs, activeTab, onTabChange, children }) => {
  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex space-x-1 p-1 bg-gray-50 rounded-t-xl overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 justify-center whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-800 text-white shadow-lg'
                  : 'text-gray-600 hover:text-blue-800 hover:bg-blue-50'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {children}
    </div>
  );
};

export default TabContainer;