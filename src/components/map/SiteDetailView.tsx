import React, { useState } from 'react';
import { Users, Wrench, Package, Building, ArrowLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { Employee, Equipment, Material, Site } from '../../types';

interface SiteDetailViewProps {
  site: Site;
  employees: Employee[];
  equipment: Equipment[];
  materials: Material[];
  onBack: () => void;
}

const SiteDetailView: React.FC<SiteDetailViewProps> = ({
  site,
  employees,
  equipment,
  materials,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState<'employees' | 'equipment' | 'materials'>('employees');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  
  // Filter entities for this site
  const siteEmployees = employees.filter(emp => emp.site === site.id);
  const siteEquipment = equipment.filter(eq => eq.site === site.id);
  const siteMaterials = materials.filter(mat => mat.site === site.id);
  
  // Group employees by department
  const employeesByDepartment = siteEmployees.reduce((acc, emp) => {
    const dept = emp.department || 'Unassigned';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(emp);
    return acc;
  }, {} as Record<string, Employee[]>);
  
  // Group equipment by type
  const equipmentByType = siteEquipment.reduce((acc, eq) => {
    const type = eq.type || 'Other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(eq);
    return acc;
  }, {} as Record<string, Equipment[]>);
  
  // Group materials by type
  const materialsByType = siteMaterials.reduce((acc, mat) => {
    const type = mat.type || 'Other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(mat);
    return acc;
  }, {} as Record<string, Material[]>);
  
  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Building className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{site.name}</h2>
            <div className="text-sm text-gray-500">{site.province} • {site.type || 'Site'}</div>
          </div>
        </div>
        
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Map</span>
        </button>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Users className="w-5 h-5 text-green-600" />
            <h3 className="font-medium text-green-800">Employees</h3>
          </div>
          <div className="text-2xl font-bold text-green-600">{siteEmployees.length}</div>
          <div className="text-sm text-green-600">
            {Object.keys(employeesByDepartment).length} departments
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Wrench className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium text-blue-800">Equipment</h3>
          </div>
          <div className="text-2xl font-bold text-blue-600">{siteEquipment.length}</div>
          <div className="text-sm text-blue-600">
            {Object.keys(equipmentByType).length} types
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Package className="w-5 h-5 text-orange-600" />
            <h3 className="font-medium text-orange-800">Materials</h3>
          </div>
          <div className="text-2xl font-bold text-orange-600">{siteMaterials.length}</div>
          <div className="text-sm text-orange-600">
            {Object.keys(materialsByType).length} categories
          </div>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex space-x-1 p-1 bg-gray-100 rounded-lg mb-6">
        <button
          onClick={() => setActiveTab('employees')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-1 justify-center ${
            activeTab === 'employees'
              ? 'bg-green-600 text-white shadow-lg'
              : 'text-gray-600 hover:text-green-800 hover:bg-green-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Employees</span>
        </button>
        <button
          onClick={() => setActiveTab('equipment')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-1 justify-center ${
            activeTab === 'equipment'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-gray-600 hover:text-blue-800 hover:bg-blue-50'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Equipment</span>
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-1 justify-center ${
            activeTab === 'materials'
              ? 'bg-orange-600 text-white shadow-lg'
              : 'text-gray-600 hover:text-orange-800 hover:bg-orange-50'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Materials</span>
        </button>
      </div>
      
      {/* Content */}
      <div className="bg-gray-50 rounded-lg p-4">
        {activeTab === 'employees' && (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Employees by Department</h3>
            
            {Object.keys(employeesByDepartment).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No employees assigned to this site
              </div>
            ) : (
              Object.entries(employeesByDepartment).map(([department, emps]) => (
                <div key={department} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div 
                    className="flex items-center justify-between p-3 bg-white cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleGroup(`emp-${department}`)}
                  >
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-green-600" />
                      <h4 className="font-medium text-gray-900">{department}</h4>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">{emps.length} employees</span>
                      {expandedGroups[`emp-${department}`] ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                  
                  {expandedGroups[`emp-${department}`] && (
                    <div className="p-3 bg-gray-50 border-t border-gray-200">
                      <div className="space-y-2">
                        {emps.map(emp => (
                          <div key={emp.id} className="flex items-center justify-between p-2 bg-white rounded-lg">
                            <div>
                              <div className="font-medium text-gray-900">{emp.name}</div>
                              <div className="text-sm text-gray-500">{emp.position}</div>
                            </div>
                            <div className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                              {emp.id}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
        
        {activeTab === 'equipment' && (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Equipment by Type</h3>
            
            {Object.keys(equipmentByType).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No equipment assigned to this site
              </div>
            ) : (
              Object.entries(equipmentByType).map(([type, eqs]) => (
                <div key={type} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div 
                    className="flex items-center justify-between p-3 bg-white cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleGroup(`eq-${type}`)}
                  >
                    <div className="flex items-center space-x-2">
                      <Wrench className="w-4 h-4 text-blue-600" />
                      <h4 className="font-medium text-gray-900">{type}</h4>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">{eqs.length} items</span>
                      {expandedGroups[`eq-${type}`] ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                  
                  {expandedGroups[`eq-${type}`] && (
                    <div className="p-3 bg-gray-50 border-t border-gray-200">
                      <div className="space-y-2">
                        {eqs.map(eq => (
                          <div key={eq.id} className="flex items-center justify-between p-2 bg-white rounded-lg">
                            <div>
                              <div className="font-medium text-gray-900">{eq.name}</div>
                              <div className="text-sm text-gray-500">{eq.model}</div>
                            </div>
                            <div className={`text-xs px-2 py-1 rounded-full ${
                              eq.status === 'available' ? 'bg-green-100 text-green-800' :
                              eq.status === 'in-use' ? 'bg-blue-100 text-blue-800' :
                              eq.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {eq.status}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
        
        {activeTab === 'materials' && (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Materials by Category</h3>
            
            {Object.keys(materialsByType).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No materials assigned to this site
              </div>
            ) : (
              Object.entries(materialsByType).map(([type, mats]) => (
                <div key={type} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div 
                    className="flex items-center justify-between p-3 bg-white cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleGroup(`mat-${type}`)}
                  >
                    <div className="flex items-center space-x-2">
                      <Package className="w-4 h-4 text-orange-600" />
                      <h4 className="font-medium text-gray-900">{type}</h4>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">{mats.length} items</span>
                      {expandedGroups[`mat-${type}`] ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                  
                  {expandedGroups[`mat-${type}`] && (
                    <div className="p-3 bg-gray-50 border-t border-gray-200">
                      <div className="space-y-2">
                        {mats.map(mat => (
                          <div key={mat.id} className="flex items-center justify-between p-2 bg-white rounded-lg">
                            <div>
                              <div className="font-medium text-gray-900">{mat.name}</div>
                              <div className="text-sm text-gray-500">{mat.quantity} {mat.unit}</div>
                            </div>
                            <div className={`text-xs px-2 py-1 rounded-full ${
                              mat.status === 'available' ? 'bg-green-100 text-green-800' :
                              mat.status === 'low-stock' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {mat.status}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SiteDetailView;