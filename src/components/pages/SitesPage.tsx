import React, { useState, useEffect } from 'react';
import { Building, Search, Filter, Download, RefreshCw, Eye, Edit, MapPin, User } from 'lucide-react';
import { DataStorage } from '../../utils/dataStorage';
import { Site, Employee, Equipment, Material } from '../../types';
import { exportToCSV } from '../../utils/csvUtils';

const SitesPage: React.FC = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredSites, setFilteredSites] = useState<Site[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState<keyof Site>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAndSortSites();
  }, [sites, searchTerm, provinceFilter, statusFilter, sortField, sortDirection]);

  const loadData = () => {
    const loadedSites = DataStorage.loadSites();
    const loadedEmployees = DataStorage.loadEmployees();
    const loadedEquipment = DataStorage.loadEquipment();
    const loadedMaterials = DataStorage.loadMaterials();
    
    setSites(loadedSites);
    setEmployees(loadedEmployees);
    setEquipment(loadedEquipment);
    setMaterials(loadedMaterials);
    setLastUpdated(new Date().toLocaleString());
  };

  const filterAndSortSites = () => {
    let filtered = sites.filter(site => {
      const matchesSearch = site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           site.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           site.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           site.manager.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProvince = !provinceFilter || site.province === provinceFilter;
      const matchesStatus = !statusFilter || getSiteStatus(site.id) === statusFilter;
      
      return matchesSearch && matchesProvince && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';
      
      if (sortDirection === 'asc') {
        return aValue.toString().localeCompare(bValue.toString());
      } else {
        return bValue.toString().localeCompare(aValue.toString());
      }
    });

    setFilteredSites(filtered);
    setCurrentPage(1);
  };

  const handleSort = (field: keyof Site) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getProvinces = () => {
    const provinces = [...new Set(sites.map(site => site.province))];
    return provinces.filter(province => province);
  };

  const getSiteStats = (siteId: string) => {
    const siteEmployees = employees.filter(emp => emp.site === siteId);
    const siteEquipment = equipment.filter(eq => eq.site === siteId);
    const siteMaterials = materials.filter(mat => mat.site === siteId);
    
    return {
      employees: siteEmployees.length,
      equipment: siteEquipment.length,
      materials: siteMaterials.length,
      activeEmployees: siteEmployees.filter(emp => emp.status === 'active').length,
      availableEquipment: siteEquipment.filter(eq => eq.status === 'available').length,
      availableMaterials: siteMaterials.filter(mat => mat.status === 'available').length
    };
  };

  const getSiteStatus = (siteId: string) => {
    const stats = getSiteStats(siteId);
    return stats.employees > 0 || stats.equipment > 0 || stats.materials > 0 ? 'active' : 'inactive';
  };

  const exportSites = () => {
    const exportData = filteredSites.map(site => {
      const stats = getSiteStats(site.id);
      return {
        'Site ID': site.id,
        'Location Name': site.name,
        'Site Type': site.type || 'N/A',
        'Province': site.province,
        'Address': site.address,
        'Site Manager': site.manager,
        'Status': getSiteStatus(site.id),
        'Employees': stats.employees,
        'Equipment': stats.equipment,
        'Materials': stats.materials,
        'Latitude': site.coordinates[1],
        'Longitude': site.coordinates[0],
        'Last Updated': new Date(site.lastUpdated).toLocaleDateString()
      };
    });
    
    exportToCSV(exportData, `sites-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800';
  };

  // Pagination
  const totalPages = Math.ceil(filteredSites.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSites = filteredSites.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Building className="w-6 h-6 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sites</h1>
              <p className="text-gray-600">Manage all company locations and work sites</p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={loadData}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <button
              onClick={exportSites}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search sites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={provinceFilter}
            onChange={(e) => setProvinceFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Provinces</option>
            {getProvinces().map(province => (
              <option key={province} value={province}>{province}</option>
            ))}
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          
          <div className="text-sm text-gray-500 flex items-center">
            <span>Last updated: {lastUpdated}</span>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredSites.length)} of {filteredSites.length} sites
          </span>
          <div className="flex space-x-4 text-sm">
            <span className="text-green-600">
              Active: {sites.filter(site => getSiteStatus(site.id) === 'active').length}
            </span>
            <span className="text-gray-600">
              Inactive: {sites.filter(site => getSiteStatus(site.id) === 'inactive').length}
            </span>
          </div>
        </div>
      </div>

      {/* Sites Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('id')}
                >
                  Site ID {sortField === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  Location Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('manager')}
                >
                  Site Manager {sortField === 'manager' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resources
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentSites.map((site) => {
                const stats = getSiteStats(site.id);
                const status = getSiteStatus(site.id);
                
                return (
                  <tr key={site.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{site.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg mr-3 flex items-center justify-center">
                          <Building className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{site.name}</div>
                          <div className="text-sm text-gray-500">{site.type || 'Site'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{site.address}</div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {site.province}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <User className="w-3 h-3 mr-1 text-gray-400" />
                        {site.manager}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex space-x-4">
                          <span className="text-blue-600">{stats.employees} emp</span>
                          <span className="text-green-600">{stats.equipment} eq</span>
                          <span className="text-orange-600">{stats.materials} mat</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedSite(site);
                            setShowDetails(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Page <span className="font-medium">{currentPage}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === page
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Site Details Modal */}
      {showDetails && selectedSite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Site Details</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Site Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 border-b pb-2">Site Information</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Site ID</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedSite.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedSite.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Site Type</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedSite.type || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Province</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedSite.province}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedSite.address}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Site Manager</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedSite.manager}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Coordinates</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedSite.coordinates[1].toFixed(4)}, {selectedSite.coordinates[0].toFixed(4)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`mt-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(getSiteStatus(selectedSite.id))}`}>
                    {getSiteStatus(selectedSite.id)}
                  </span>
                </div>
              </div>

              {/* Site Resources */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 border-b pb-2">Site Resources</h4>
                {(() => {
                  const stats = getSiteStats(selectedSite.id);
                  const siteEmployees = employees.filter(emp => emp.site === selectedSite.id);
                  const siteEquipment = equipment.filter(eq => eq.site === selectedSite.id);
                  const siteMaterials = materials.filter(mat => mat.site === selectedSite.id);
                  
                  return (
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h5 className="font-medium text-blue-900 mb-2">Employees ({stats.employees})</h5>
                        <div className="text-sm text-blue-800">
                          Active: {stats.activeEmployees} | Total: {stats.employees}
                        </div>
                        {siteEmployees.slice(0, 3).map(emp => (
                          <div key={emp.id} className="text-xs text-blue-700 mt-1">
                            {emp.name} - {emp.position}
                          </div>
                        ))}
                        {siteEmployees.length > 3 && (
                          <div className="text-xs text-blue-600 mt-1">
                            +{siteEmployees.length - 3} more...
                          </div>
                        )}
                      </div>

                      <div className="bg-green-50 rounded-lg p-4">
                        <h5 className="font-medium text-green-900 mb-2">Equipment ({stats.equipment})</h5>
                        <div className="text-sm text-green-800">
                          Available: {stats.availableEquipment} | Total: {stats.equipment}
                        </div>
                        {siteEquipment.slice(0, 3).map(eq => (
                          <div key={eq.id} className="text-xs text-green-700 mt-1">
                            {eq.name} - {eq.status}
                          </div>
                        ))}
                        {siteEquipment.length > 3 && (
                          <div className="text-xs text-green-600 mt-1">
                            +{siteEquipment.length - 3} more...
                          </div>
                        )}
                      </div>

                      <div className="bg-orange-50 rounded-lg p-4">
                        <h5 className="font-medium text-orange-900 mb-2">Materials ({stats.materials})</h5>
                        <div className="text-sm text-orange-800">
                          Available: {stats.availableMaterials} | Total: {stats.materials}
                        </div>
                        {siteMaterials.slice(0, 3).map(mat => (
                          <div key={mat.id} className="text-xs text-orange-700 mt-1">
                            {mat.name} - {mat.quantity} {mat.unit}
                          </div>
                        ))}
                        {siteMaterials.length > 3 && (
                          <div className="text-xs text-orange-600 mt-1">
                            +{siteMaterials.length - 3} more...
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SitesPage;