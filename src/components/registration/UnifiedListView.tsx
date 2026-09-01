import React, { useState, useEffect, useCallback } from 'react';
import { 
  Trash2, 
  Edit, 
  Eye, 
  Download, 
  Upload, 
  Search, 
  Printer,
  AlertCircle
} from 'lucide-react';
import { DataStorage } from '../../utils/dataStorage';

import QRCodeDisplay from './QRCodeDisplay';
import ProfileView from './ProfileView';
import { AuthManager } from '../../utils/authUtils';
import { SupabaseDataService } from '../../utils/supabaseDataService';

interface UnifiedListViewProps {
  type: 'employees' | 'equipment' | 'materials' | 'sites' | 'departments';
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
  onImport?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExport?: () => void;
  refreshTrigger?: number; // Add this to trigger refresh from parent
}

const UnifiedListView: React.FC<UnifiedListViewProps> = ({ 
  type, 
  onEdit, 
  onDelete,
  onImport,
  onExport,
  refreshTrigger
}) => {
  const [items, setItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showQRCode, setShowQRCode] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);
  const [showProfileView, setShowProfileView] = useState(false);
  const [selectedProfileItem, setSelectedProfileItem] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [siteFilter, setSiteFilter] = useState('');
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const currentUser = AuthManager.getCurrentUserSync();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'developer';

  const loadData = useCallback(async () => {
    let loadedItems: any[] = [];
    const useSupabase = await AuthManager.shouldUseSupabase();
    
    try {
      if (useSupabase) {
        // Load from Supabase
        switch (type) {
          case 'employees':
            loadedItems = await SupabaseDataService.getEmployees();
            break;
          case 'equipment':
            loadedItems = await SupabaseDataService.getEquipment();
            break;
          case 'materials':
            loadedItems = await SupabaseDataService.getMaterials();
            break;
          case 'sites':
            loadedItems = await SupabaseDataService.getSites();
            break;
          case 'departments':
            loadedItems = await SupabaseDataService.getDepartments();
            break;
        }
      } else {
        // Load from local storage
        switch (type) {
          case 'employees':
            loadedItems = DataStorage.loadEmployees();
            break;
          case 'equipment':
            loadedItems = DataStorage.loadEquipment();
            break;
          case 'materials':
            loadedItems = DataStorage.loadMaterials();
            break;
          case 'sites':
            loadedItems = DataStorage.loadSites();
            break;
          case 'departments':
            loadedItems = DataStorage.loadDepartments();
            break;
        }
      }
    } catch (error) {
      console.error(`Error loading ${type}:`, error);
      // Fallback to local storage on error
      switch (type) {
        case 'employees':
          loadedItems = DataStorage.loadEmployees();
          break;
        case 'equipment':
          loadedItems = DataStorage.loadEquipment();
          break;
        case 'materials':
          loadedItems = DataStorage.loadMaterials();
          break;
        case 'sites':
          loadedItems = DataStorage.loadSites();
          break;
        case 'departments':
          loadedItems = DataStorage.loadDepartments();
          break;
      }
    }
    
    setItems(loadedItems);
    setSelectedItems([]);
  }, [type]);

  useEffect(() => {
    const fetchData = async () => {
      await loadData();
    };
    fetchData();
  }, [loadData, refreshTrigger]);

  useEffect(() => {
    filterAndSortItems();
  }, [items, searchTerm, sortField, sortDirection, statusFilter, typeFilter, departmentFilter, siteFilter]);

  const filterAndSortItems = () => {
    let filtered = [...items];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item => {
        const searchableFields = ['name', 'id', 'oldId', 'type', 'department', 'position', 'model', 'province', 'manager'];
        return searchableFields.some(field => 
          item[field] && item[field].toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }
    
    // Apply status filter
    if (statusFilter && (type === 'employees' || type === 'equipment' || type === 'materials')) {
      filtered = filtered.filter(item => item.status === statusFilter);
    }
    
    // Apply type filter
    if (typeFilter && (type === 'equipment' || type === 'materials' || type === 'sites')) {
      filtered = filtered.filter(item => item.type === typeFilter);
    }
    
    // Apply department filter
    if (departmentFilter && type === 'employees') {
      filtered = filtered.filter(item => item.department === departmentFilter);
    }
    
    // Apply site filter
    if (siteFilter && (type === 'employees' || type === 'equipment' || type === 'materials')) {
      filtered = filtered.filter(item => item.site === siteFilter);
    }
    
    // Sort items
    filtered.sort((a, b) => {
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';
      
      if (sortDirection === 'asc') {
        return aValue.toString().localeCompare(bValue.toString());
      } else {
        return bValue.toString().localeCompare(aValue.toString());
      }
    });
    
    setFilteredItems(filtered);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedItems(filteredItems.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const handleDeleteSelected = () => {
    setItemsToDelete(selectedItems);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    itemsToDelete.forEach(id => {
      onDelete(id);
    });
    setShowDeleteConfirm(false);
    setItemsToDelete([]);
    setSelectedItems([]);
  };

  const handleShowQRCode = (item: any) => {
    setSelectedItem(item);
    setShowQRCode(true);
  };

  const handleViewProfile = (item: any) => {
    setSelectedProfileItem(item);
    setShowProfileView(true);
  };

  const getStatusOptions = () => {
    switch (type) {
      case 'employees':
        return ['active', 'inactive'];
      case 'equipment':
        return ['available', 'in-use', 'maintenance', 'down'];
      case 'materials':
        return ['available', 'low-stock', 'out-of-stock'];
      default:
        return [];
    }
  };

  const getTypeOptions = () => {
    const types = new Set<string>();
    items.forEach(item => {
      if (item.type) types.add(item.type);
    });
    return Array.from(types);
  };

  const getDepartmentOptions = () => {
    const departments = new Set<string>();
    items.forEach(item => {
      if (item.department) departments.add(item.department);
    });
    return Array.from(departments);
  };

  const getSiteOptions = () => {
    const sites = DataStorage.loadSites();
    return sites.map(site => ({ id: site.id, name: site.name }));
  };

  const getSiteName = (siteId: string) => {
    const sites = DataStorage.loadSites();
    const site = sites.find(s => s.id === siteId);
    return site ? site.name : 'Unknown Site';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'inactive':
      case 'down':
        return 'bg-red-100 text-red-800';
      case 'in-use':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
      case 'low-stock':
        return 'bg-yellow-100 text-yellow-800';
      case 'out-of-stock':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderTableHeader = () => {
    switch (type) {
      case 'employees':
        return (
          <tr className="bg-gray-50 border-b border-gray-200">
            {isAdmin && (
              <th className="px-4 py-3 text-left">
                <input 
                  type="checkbox" 
                  checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300"
                />
              </th>
            )}
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('id')}
            >
              ID {sortField === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('oldId')}
            >
              Legacy ID {sortField === 'oldId' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('name')}
            >
              Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('department')}
            >
              Department {sortField === 'department' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('position')}
            >
              Position {sortField === 'position' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('site')}
            >
              Site {sortField === 'site' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('status')}
            >
              Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        );
      case 'equipment':
        return (
          <tr className="bg-gray-50 border-b border-gray-200">
            {isAdmin && (
              <th className="px-4 py-3 text-left">
                <input 
                  type="checkbox" 
                  checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300"
                />
              </th>
            )}
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('id')}
            >
              ID {sortField === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('oldId')}
            >
              Legacy ID {sortField === 'oldId' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('name')}
            >
              Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('type')}
            >
              Type {sortField === 'type' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('model')}
            >
              Model {sortField === 'model' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('site')}
            >
              Site {sortField === 'site' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('status')}
            >
              Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        );
      case 'materials':
        return (
          <tr className="bg-gray-50 border-b border-gray-200">
            {isAdmin && (
              <th className="px-4 py-3 text-left">
                <input 
                  type="checkbox" 
                  checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300"
                />
              </th>
            )}
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('id')}
            >
              ID {sortField === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('oldId')}
            >
              Legacy ID {sortField === 'oldId' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('name')}
            >
              Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('type')}
            >
              Type {sortField === 'type' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('quantity')}
            >
              Quantity {sortField === 'quantity' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('site')}
            >
              Site {sortField === 'site' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('status')}
            >
              Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        );
      case 'sites':
        return (
          <tr className="bg-gray-50 border-b border-gray-200">
            {isAdmin && (
              <th className="px-4 py-3 text-left">
                <input 
                  type="checkbox" 
                  checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300"
                />
              </th>
            )}
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('id')}
            >
              ID {sortField === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('name')}
            >
              Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('type')}
            >
              Type {sortField === 'type' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('province')}
            >
              Province {sortField === 'province' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('manager')}
            >
              Manager {sortField === 'manager' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        );
      case 'departments':
        return (
          <tr className="bg-gray-50 border-b border-gray-200">
            {isAdmin && (
              <th className="px-4 py-3 text-left">
                <input 
                  type="checkbox" 
                  checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300"
                />
              </th>
            )}
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('id')}
            >
              ID {sortField === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('name')}
            >
              Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('description')}
            >
              Description {sortField === 'description' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('createdAt')}
            >
              Created {sortField === 'createdAt' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        );
      default:
        return null;
    }
  };

  const renderTableRow = (item: any) => {
    switch (type) {
      case 'employees':
        return (
          <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
            {isAdmin && (
              <td className="px-4 py-3">
                <input 
                  type="checkbox" 
                  checked={selectedItems.includes(item.id)}
                  onChange={() => handleSelectItem(item.id)}
                  className="rounded border-gray-300"
                />
              </td>
            )}
            <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.id}</td>
            <td className="px-4 py-3 text-sm text-gray-500">{item.oldId}</td>
            <td className="px-4 py-3">
              <div className="flex items-center">
                {item.photo ? (
                  <img src={item.photo} alt={item.name} className="w-8 h-8 rounded-full mr-3" />
                ) : (
                  <div className="w-8 h-8 bg-gray-200 rounded-full mr-3 flex items-center justify-center">
                    <span className="text-gray-500 text-xs">{item.name.charAt(0)}</span>
                  </div>
                )}
                <div className="text-sm font-medium text-gray-900">{item.name}</div>
              </div>
            </td>
            <td className="px-4 py-3 text-sm text-gray-500">{item.department}</td>
            <td className="px-4 py-3 text-sm text-gray-500">{item.position}</td>
            <td className="px-4 py-3 text-sm text-gray-500">{getSiteName(item.site)}</td>
            <td className="px-4 py-3">
              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}>
                {item.status}
              </span>
            </td>
            <td className="px-4 py-3 text-sm font-medium">
              <div className="flex space-x-2">
                <button
                  onClick={() => handleViewProfile(item)}
                  className="text-purple-600 hover:text-purple-900"
                  title="View Profile"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onEdit(item)}
                  className="text-blue-600 hover:text-blue-900"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleShowQRCode(item)}
                  className="text-green-600 hover:text-green-900"
                  title="ID Card"
                >
                  <Printer className="w-4 h-4" />
                </button>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setItemsToDelete([item.id]);
                      setShowDeleteConfirm(true);
                    }}
                    className="text-red-600 hover:text-red-900"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </td>
          </tr>
        );
      case 'equipment':
        return (
          <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
            {isAdmin && (
              <td className="px-4 py-3">
                <input 
                  type="checkbox" 
                  checked={selectedItems.includes(item.id)}
                  onChange={() => handleSelectItem(item.id)}
                  className="rounded border-gray-300"
                />
              </td>
            )}
            <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.id}</td>
            <td className="px-4 py-3 text-sm text-gray-500">{item.oldId}</td>
            <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
            <td className="px-4 py-3 text-sm text-gray-500">{item.type}</td>
            <td className="px-4 py-3 text-sm text-gray-500">{item.model}</td>
            <td className="px-4 py-3 text-sm text-gray-500">{getSiteName(item.site)}</td>
            <td className="px-4 py-3">
              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}>
                {item.status}
              </span>
            </td>
            <td className="px-4 py-3 text-sm font-medium">
              <div className="flex space-x-2">
                <button
                  onClick={() => handleViewProfile(item)}
                  className="text-purple-600 hover:text-purple-900"
                  title="View Profile"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onEdit(item)}
                  className="text-blue-600 hover:text-blue-900"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleShowQRCode(item)}
                  className="text-green-600 hover:text-green-900"
                  title="QR Code"
                >
                  <Printer className="w-4 h-4" />
                </button>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setItemsToDelete([item.id]);
                      setShowDeleteConfirm(true);
                    }}
                    className="text-red-600 hover:text-red-900"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </td>
          </tr>
        );
      case 'materials':
        return (
          <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
            {isAdmin && (
              <td className="px-4 py-3">
                <input 
                  type="checkbox" 
                  checked={selectedItems.includes(item.id)}
                  onChange={() => handleSelectItem(item.id)}
                  className="rounded border-gray-300"
                />
              </td>
            )}
            <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.id}</td>
            <td className="px-4 py-3 text-sm text-gray-500">{item.oldId}</td>
            <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
            <td className="px-4 py-3 text-sm text-gray-500">{item.type}</td>
            <td className="px-4 py-3 text-sm text-gray-500">{item.quantity} {item.unit}</td>
            <td className="px-4 py-3 text-sm text-gray-500">{getSiteName(item.site)}</td>
            <td className="px-4 py-3">
              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}>
                {item.status}
              </span>
            </td>
            <td className="px-4 py-3 text-sm font-medium">
              <div className="flex space-x-2">
                <button
                  onClick={() => handleViewProfile(item)}
                  className="text-purple-600 hover:text-purple-900"
                  title="View Profile"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onEdit(item)}
                  className="text-blue-600 hover:text-blue-900"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleShowQRCode(item)}
                  className="text-green-600 hover:text-green-900"
                  title="QR Code"
                >
                  <Printer className="w-4 h-4" />
                </button>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setItemsToDelete([item.id]);
                      setShowDeleteConfirm(true);
                    }}
                    className="text-red-600 hover:text-red-900"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </td>
          </tr>
        );
      case 'sites':
        return (
          <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
            {isAdmin && (
              <td className="px-4 py-3">
                <input 
                  type="checkbox" 
                  checked={selectedItems.includes(item.id)}
                  onChange={() => handleSelectItem(item.id)}
                  className="rounded border-gray-300"
                />
              </td>
            )}
            <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.id}</td>
            <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
            <td className="px-4 py-3 text-sm text-gray-500">{item.type || 'N/A'}</td>
            <td className="px-4 py-3 text-sm text-gray-500">{item.province}</td>
            <td className="px-4 py-3 text-sm text-gray-500">{item.manager}</td>
            <td className="px-4 py-3 text-sm font-medium">
              <div className="flex space-x-2">
                <button
                  onClick={() => handleViewProfile(item)}
                  className="text-purple-600 hover:text-purple-900"
                  title="View Profile"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onEdit(item)}
                  className="text-blue-600 hover:text-blue-900"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleShowQRCode(item)}
                  className="text-green-600 hover:text-green-900"
                  title="QR Code"
                >
                  <Printer className="w-4 h-4" />
                </button>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setItemsToDelete([item.id]);
                      setShowDeleteConfirm(true);
                    }}
                    className="text-red-600 hover:text-red-900"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </td>
          </tr>
        );
      case 'departments':
        return (
          <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
            {isAdmin && (
              <td className="px-4 py-3">
                <input 
                  type="checkbox" 
                  checked={selectedItems.includes(item.id)}
                  onChange={() => handleSelectItem(item.id)}
                  className="rounded border-gray-300"
                />
              </td>
            )}
            <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.id}</td>
            <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
            <td className="px-4 py-3 text-sm text-gray-500">{item.description || 'N/A'}</td>
            <td className="px-4 py-3 text-sm text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</td>
            <td className="px-4 py-3 text-sm font-medium">
              <div className="flex space-x-2">
                <button
                  onClick={() => onEdit(item)}
                  className="text-blue-600 hover:text-blue-900"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setItemsToDelete([item.id]);
                      setShowDeleteConfirm(true);
                    }}
                    className="text-red-600 hover:text-red-900"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </td>
          </tr>
        );
      default:
        return null;
    }
  };

  const renderFilterControls = () => {
    return (
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-grow max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${type}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {/* Status Filter */}
        {(type === 'employees' || type === 'equipment' || type === 'materials') && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            {getStatusOptions().map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        )}
        
        {/* Type Filter */}
        {(type === 'equipment' || type === 'materials' || type === 'sites') && (
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            {getTypeOptions().map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        )}
        
        {/* Department Filter */}
        {type === 'employees' && (
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Departments</option>
            {getDepartmentOptions().map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        )}
        
        {/* Site Filter */}
        {(type === 'employees' || type === 'equipment' || type === 'materials') && (
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Sites</option>
            {getSiteOptions().map(site => (
              <option key={site.id} value={site.id}>{site.name}</option>
            ))}
          </select>
        )}
        
        {/* Import/Export Buttons */}
        <div className="flex space-x-2 ml-auto">
          {onImport && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Import</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={onImport}
                className="hidden"
              />
            </>
          )}
          
          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderFilterControls()}
      
      {/* Selected Items Actions */}
      {isAdmin && selectedItems.length > 0 && (
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 flex items-center justify-between mb-4">
          <div className="text-sm text-blue-800">
            <span className="font-medium">{selectedItems.length}</span> {type} selected
          </div>
          <button
            onClick={handleDeleteSelected}
            className="flex items-center space-x-2 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Selected</span>
          </button>
        </div>
      )}
      
      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              {renderTableHeader()}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.length > 0 ? (
                filteredItems.map(item => renderTableRow(item))
              ) : (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="px-4 py-8 text-center text-gray-500">
                    No {type} found. {searchTerm && `Try adjusting your search for "${searchTerm}".`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* QR Code Modal */}
      {showQRCode && selectedItem && (
        <QRCodeDisplay
          entity={selectedItem}
          entityType={type.slice(0, -1) as any}
          onClose={() => setShowQRCode(false)}
        />
      )}
      
      {/* Profile View Modal */}
      {showProfileView && selectedProfileItem && (
        <ProfileView
          entity={selectedProfileItem}
          entityType={type.slice(0, -1)}
          onClose={() => setShowProfileView(false)}
          onEdit={() => {
            setShowProfileView(false);
            onEdit(selectedProfileItem);
          }}
        />
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {itemsToDelete.length === 1 ? 'this item' : `these ${itemsToDelete.length} items`}? 
              This action cannot be undone.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedListView;