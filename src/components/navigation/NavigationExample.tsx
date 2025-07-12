import React from 'react';
import HierarchicalDropdown, { NavigationItem } from './HierarchicalDropdown';

const NavigationExample: React.FC = () => {
  // Sample navigation data with multiple levels
  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      onClick: () => console.log('Dashboard clicked')
    },
    {
      id: 'employees',
      label: 'Employees',
      children: [
        {
          id: 'emp-list',
          label: 'View All Employees',
          onClick: () => console.log('View employees clicked')
        },
        {
          id: 'emp-add',
          label: 'Add Employee',
          onClick: () => console.log('Add employee clicked')
        },
        {
          id: 'emp-departments',
          label: 'Departments',
          children: [
            {
              id: 'dept-engineering',
              label: 'Engineering',
              onClick: () => console.log('Engineering department clicked')
            },
            {
              id: 'dept-operations',
              label: 'Operations',
              onClick: () => console.log('Operations department clicked')
            },
            {
              id: 'dept-management',
              label: 'Management',
              children: [
                {
                  id: 'mgmt-executive',
                  label: 'Executive',
                  onClick: () => console.log('Executive management clicked')
                },
                {
                  id: 'mgmt-middle',
                  label: 'Middle Management',
                  onClick: () => console.log('Middle management clicked')
                }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'equipment',
      label: 'Equipment',
      children: [
        {
          id: 'equip-list',
          label: 'View All Equipment',
          onClick: () => console.log('View equipment clicked')
        },
        {
          id: 'equip-add',
          label: 'Add Equipment',
          onClick: () => console.log('Add equipment clicked')
        },
        {
          id: 'equip-categories',
          label: 'Categories',
          children: [
            {
              id: 'cat-heavy',
              label: 'Heavy Machinery',
              onClick: () => console.log('Heavy machinery clicked')
            },
            {
              id: 'cat-tools',
              label: 'Tools',
              onClick: () => console.log('Tools clicked')
            }
          ]
        }
      ]
    },
    {
      id: 'materials',
      label: 'Materials',
      children: [
        {
          id: 'mat-list',
          label: 'View All Materials',
          onClick: () => console.log('View materials clicked')
        },
        {
          id: 'mat-add',
          label: 'Add Material',
          onClick: () => console.log('Add material clicked')
        }
      ]
    },
    {
      id: 'reports',
      label: 'Reports',
      children: [
        {
          id: 'report-daily',
          label: 'Daily Reports',
          onClick: () => console.log('Daily reports clicked')
        },
        {
          id: 'report-weekly',
          label: 'Weekly Reports',
          onClick: () => console.log('Weekly reports clicked')
        },
        {
          id: 'report-custom',
          label: 'Custom Reports',
          children: [
            {
              id: 'custom-employee',
              label: 'Employee Reports',
              onClick: () => console.log('Employee reports clicked')
            },
            {
              id: 'custom-equipment',
              label: 'Equipment Reports',
              onClick: () => console.log('Equipment reports clicked')
            },
            {
              id: 'custom-material',
              label: 'Material Reports',
              onClick: () => console.log('Material reports clicked')
            }
          ]
        }
      ]
    }
  ];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Hierarchical Dropdown Navigation</h1>
      
      <div className="mb-8">
        <p className="text-gray-600 mb-4">
          This example demonstrates a multi-level dropdown navigation system. Hover or click on items with children to see nested dropdown menus.
        </p>
        
        <div className="flex space-x-4">
          <HierarchicalDropdown items={navigationItems} title="Navigation Menu" />
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Features</h2>
        <ul className="list-disc pl-5 space-y-2 text-gray-700">
          <li>Hover or click to open nested dropdown menus</li>
          <li>Consistent styling across all dropdown levels</li>
          <li>Smooth animations for dropdown transitions</li>
          <li>Parent selection remains visible while child dropdowns are open</li>
          <li>Dropdowns close when clicking outside</li>
          <li>Fully keyboard accessible</li>
        </ul>
      </div>
    </div>
  );
};

export default NavigationExample;