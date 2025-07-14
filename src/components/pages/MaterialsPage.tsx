import React, { useState, useEffect } from 'react';
import { Package, Search, Filter, Download, RefreshCw, Eye, Edit, AlertTriangle, TrendingDown } from 'lucide-react';
import { DataStorage } from '../../utils/dataStorage';
import { fetchData } from '../../utils/dataProxy';
import { Material, Site } from '../../types';
import { exportToCSV } from '../../utils/csvUtils';

const MaterialsPage: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState<keyof Material>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadData();
    
    // Listen for storage changes to auto-refresh when materials are updated
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'qr_system_materials' && e.newValue !== e.oldValue) {
        console.log('Materials updated in storage, refreshing list...');
        loadData();
      }
    };
    
    // Listen for custom events from other components
    const handleMaterialUpdate = () => {
      console.log('Material update event received, refreshing list...');
      loadData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('materialUpdated', handleMaterialUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('materialUpdated', handleMaterialUpdate);
    };
  }, []);

  useEffect(() => {
    filterAndSortMaterials();
  }, [materials, searchTerm, categoryFilter, statusFilter, sortField, sortDirection]);

  const loadData = async () => {
    try {
      const [loadedMaterials, loadedSites] = await Promise.all([
        fetchData('materials'),
        fetchData('sites')
      ]);
      
      setMaterials(loadedMaterials as Material[]);
      setSites(loadedSites as Site[]);
      setLastUpdated(new Date().toLocaleString());
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const filterAndSortMaterials = () => {
    let filtered = materials.filter(material => {
      const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           material.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           material.type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !categoryFilter || material.type === categoryFilter;
      const matchesStatus = !statusFilter || material.status === statusFilter;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      // Handle numeric sorting for quantity
      if (sortField === 'quantity') {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      } else {
        aValue = aValue?.toString() || '';
        bValue = bValue?.toString() || '';
      }
      
      if (sortDirection === 'asc') {
        return typeof aValue === 'number' ? aValue - bValue : aValue.localeCompare(bValue);
      } else {
        return typeof bValue === 'number' ? bValue - aValue : bValue.localeCompare(aValue);
      }
    });

    setFilteredMaterials(filtered);
    setCurrentPage(1);
  };

  const handleSort = (field: keyof Material) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSiteName = (siteId: string) => {
    const site = sites.find(s => s.id === siteId);
    return site ? site.name : 'Unknown Site';
  };

  const getMaterialCategories = () => {
    const categories = [...new Set(materials.map(mat => mat.type))];
    return categories.filter(category => category);
  };

  const exportMaterials = () => {
    const exportData = filteredMaterials.map(mat => ({
      'Material ID': mat.id,
      'Name': mat.name,
      'Category': mat.type,
      'Quantity in Stock': mat.quantity,
      'Unit of Measurement': mat.unit,
      'Status': mat.status,
      'Location': getSiteName(mat.site),
      'Usage': mat.use || 'N/A',
      'Created Date': new Date(mat.createdAt).toLocaleDateString(),
      'Last Updated': new Date(mat.lastUpdated).toLocaleDateString()
    }));
    
    exportToCSV(exportData, `materials-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'low-stock': return 'bg-yellow-100 text-yellow-800';
      case 'out-of-stock': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockLevel = (quantity: number) => {
    if (quantity === 0) return 'critical';
    if (quantity < 50) return 'low';
    return 'normal';
  };

  const getStockIcon = (quantity: number) => {
    const level = getStockLevel(quantity);
    if (level === 'critical') return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (level === 'low') return <TrendingDown className="w-4 h-4 text-yellow-500" />;
    return null;
  };

  // Get low stock alerts
  const lowStockMaterials = materials.filter(mat => mat.quantity < 50 && mat.quantity > 0);
  const outOfStockMaterials = materials.filter(mat => mat.quantity === 0);

  // Pagination
  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMaterials = filteredMaterials.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Package className="w-6 h-6 text-orange-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Materials</h1>
              <p className="text-gray-600">Manage inventory and track material supplies</p>
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
              onClick={exportMaterials}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Alerts */}
        {(lowStockMaterials.length > 0 || outOfStockMaterials.length > 0) && (
          <div className="mb-6 space-y-2">
            {outOfStockMaterials.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-900">
                    Critical: {outOfStockMaterials.length} materials are out of stock
                  </span>
                </div>
              </div>
            )}
            {lowStockMaterials.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium text-yellow-900">
                    Warning: {lowStockMaterials.length} materials are running low
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filters and Search */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {getMaterialCategories().map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
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
            Showing {startIndex + 1}-{Math.min(endIndex, filteredMaterials.length)} of {filteredMaterials.length} materials
          </span>
          <div className="flex space-x-4 text-sm">
            <span className="text-green-600">Available: {materials.filter(mat => mat.status === 'available').length}</span>
            <span className="text-yellow-600">Low Stock: {materials.filter(mat => mat.status === 'low-stock').length}</span>
            <span className="text-red-600">Out of Stock: {materials.filter(mat => mat.status === 'out-of-stock').length}</span>
          </div>
        </div>
      </div>

      {/* Materials Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('id')}
                >
                  Material ID {sortField === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('type')}
                >
                  Category {sortField === 'type' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('quantity')}
                >
                  Quantity in Stock {sortField === 'quantity' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit of Measurement
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentMaterials.map((material) => (
                <tr key={material.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{material.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg mr-3 flex items-center justify-center">
                        <Package className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{material.name}</div>
                        <div className="text-sm text-gray-500">{getSiteName(material.site)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{material.type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStockIcon(material.quantity)}
                      <span className={`text-sm font-medium ml-2 ${
                        material.quantity === 0 ? 'text-red-600' :
                        material.quantity < 50 ? 'text-yellow-600' : 'text-gray-900'
                      }`}>
                        {material.quantity}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{material.unit}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(material.status)}`}>
                      {material.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedMaterial(material);
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
              ))}
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

      {/* Material Details Modal */}
      {showDetails && selectedMaterial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Material Details</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Material ID</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedMaterial.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedMaterial.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedMaterial.type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Usage</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedMaterial.use || 'Not specified'}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity in Stock</label>
                  <div className="flex items-center mt-1">
                    {getStockIcon(selectedMaterial.quantity)}
                    <span className={`text-sm font-medium ml-2 ${
                      selectedMaterial.quantity === 0 ? 'text-red-600' :
                      selectedMaterial.quantity < 50 ? 'text-yellow-600' : 'text-gray-900'
                    }`}>
                      {selectedMaterial.quantity} {selectedMaterial.unit}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Unit of Measurement</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedMaterial.unit}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <p className="mt-1 text-sm text-gray-900">{getSiteName(selectedMaterial.site)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`mt-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedMaterial.status)}`}>
                    {selectedMaterial.status}
                  </span>
                </div>
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

export default MaterialsPage;