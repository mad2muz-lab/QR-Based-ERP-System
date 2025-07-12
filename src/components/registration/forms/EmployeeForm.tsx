import React, { useState, useEffect } from 'react';
import { User, Camera, Trash2, AlertCircle } from 'lucide-react';
import { Employee } from '../../../types';
import { employeeTypes } from '../../../data/materialTypes';
import { DataStorage } from '../../../utils/dataStorage';
import { AuthManager } from '../../../utils/authUtils';
import PhotoCapture from '../PhotoCapture';
import { generateQRCode } from '../../../utils/qrCodeUtils';

interface EmployeeFormProps {
  sites: any[];
  onSubmit: (employee: Omit<Employee, 'createdAt' | 'qrCode'>) => void;
  initialData?: Employee | null;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ sites, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    type: '',
    customType: '',
    department: '',
    position: '',
    bloodGroup: '',
    site: '',
    status: 'active' as const,
    photo: '',
    email: '',
    phone: ''
  });
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [showCustomType, setShowCustomType] = useState(false);
  const [idError, setIdError] = useState('');
  const [isCheckingId, setIsCheckingId] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [showCustomDepartment, setShowCustomDepartment] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qrCodeImage, setQrCodeImage] = useState<string>('');

  // Handle initial data for editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id || '',
        name: initialData.name || '',
        type: initialData.type || '',
        customType: '',
        department: initialData.department || '',
        position: initialData.position || '',
        bloodGroup: initialData.bloodGroup || '',
        site: initialData.site || '',
        status: initialData.status || 'active',
        photo: initialData.photo || '',
        email: initialData.email || '',
        phone: initialData.phone || ''
      });
      
      // Check if we need to show custom type
      const isCustomType = !employeeTypes.includes(initialData.type || '');
      setShowCustomType(isCustomType);
      if (isCustomType) {
        setFormData(prev => ({ ...prev, customType: initialData.type || '' }));
      }
    } else {
      // Reset form when no initial data (new registration)
      setFormData({
        id: '',
        name: '',
        type: '',
        customType: '',
        department: '',
        position: '',
        bloodGroup: '',
        site: '',
        status: 'active',
        photo: '',
        email: '',
        phone: ''
      });
      setShowCustomType(false);
      setIdError('');
    }
  }, [initialData]);

  // Real-time ID validation
  useEffect(() => {
    if (formData.id.trim() === '') {
      setIdError('');
      return;
    }

    setIsCheckingId(true);
    const timeoutId = setTimeout(() => {
      const existingEmployees = DataStorage.loadEmployees();
      const isDuplicate = existingEmployees.some(emp => emp.id === formData.id);
      
      if (isDuplicate) {
        setIdError('Employee ID already exists. Please choose a different ID.');
      } else {
        setIdError('');
      }
      setIsCheckingId(false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.id]);

  // Load departments and user info
  useEffect(() => {
    loadDepartments();
    setCurrentUser(AuthManager.getCurrentUser());
  }, []);

  const loadDepartments = () => {
    const loadedDepartments = DataStorage.loadDepartments();
    setDepartments(loadedDepartments);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) {
      return;
    }
    
    setIsSubmitting(true);
    
    // Final ID validation
    if (idError) {
      setIsSubmitting(false);
      return;
    }

    if (!formData.id.trim()) {
      setIdError('Employee ID is required');
      setIsSubmitting(false);
      return;
    }

    try {
      // Generate QR code for the employee ID
      if (formData.id.trim()) {
        const qrCode = await generateQRCode(formData.id.trim());
        setQrCodeImage(qrCode);
      }
      
      const employeeData = {
        ...formData,
        type: showCustomType ? formData.customType : formData.type
      };
      
      // Remove customType from the final data
      const { customType, ...finalData } = employeeData;
      
      // Include QR code in the submission
      // Submit the employee data
      onSubmit(finalData);
      
      // Reset form only after successful submission
      setFormData({
        id: '',
        name: '',
        type: '',
        customType: '',
        department: '',
        position: '',
        bloodGroup: '',
        site: '',
        status: 'active',
        photo: '',
        email: '',
        phone: ''
      });
      setShowCustomType(false);
      setIdError('');
      
    } catch (error) {
      console.error('Error submitting employee:', error);
      alert('Failed to register employee. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDepartmentChange = (value: string) => {
    if (value === 'other') {
      setShowCustomDepartment(true);
      setFormData({ ...formData, department: '' });
    } else {
      setShowCustomDepartment(false);
      setFormData({ ...formData, department: value });
    }
  };
  const handleTypeChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomType(true);
      setFormData({ ...formData, type: '', customType: '' });
    } else {
      setShowCustomType(false);
      setFormData({ ...formData, type: value, customType: '' });
    }
  };

  const handlePhotoCapture = (photoDataUrl: string) => {
    setFormData({ ...formData, photo: photoDataUrl });
  };

  const removePhoto = () => {
    setFormData({ ...formData, photo: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <User className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Register New Employee</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Employee ID - Mandatory Manual Input */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employee ID * <span className="text-xs text-gray-500">(Must be unique)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value.trim() })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  idError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter unique employee ID (e.g., EMP-001, 12345)"
                required
              />
              {isCheckingId && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
            {idError && (
              <div className="flex items-center space-x-2 mt-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{idError}</span>
              </div>
            )}
            {formData.id && !idError && !isCheckingId && (
              <div className="text-green-600 text-sm mt-1">✓ Employee ID is available</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee Type *</label>
            {showCustomType ? (
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={formData.customType}
                  onChange={(e) => setFormData({ ...formData, customType: e.target.value })}
                  placeholder="Enter custom employee type"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCustomType(false)}
                  className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <select
                value={formData.type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select employee type</option>
                {employeeTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
                <option value="custom">+ Add Custom Type</option>
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
            {showCustomDepartment ? (
              <div className="space-y-2">
                <select
                  value="other"
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="other">Other</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Custom departments can only be added by administrators. Please contact your system administrator.
                  </p>
                </div>
              </div>
            ) : (
              <select
                value={formData.department}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.name}>{dept.name}</option>
                ))}
                <option value="other">Other</option>
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
            <select
              value={formData.bloodGroup}
              onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select blood group</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="employee@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="000-000-0000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site Assignment *</label>
            <select
              value={formData.site}
              onChange={(e) => setFormData({ ...formData, site: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select site</option>
              {sites.map(site => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Photo Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Employee Photo</label>
          {formData.photo ? (
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img
                  src={formData.photo}
                  alt="Employee"
                  className="w-20 h-20 object-cover rounded-lg border-2 border-gray-300"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">Photo ready for ID card</p>
                <button
                  type="button"
                  onClick={() => setShowPhotoCapture(true)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Change photo
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowPhotoCapture(true)}
              className="flex items-center space-x-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors w-full h-32 justify-center"
            >
              <div className="text-center">
                <Camera className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <span className="text-gray-600 block">Add Employee Photo</span>
                <span className="text-xs text-gray-500 block mt-1">Click to capture or upload</span>
              </div>
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={!!idError || isCheckingId || !formData.id.trim() || isSubmitting}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Registering...' : 'Register Employee'}
        </button>
      </form>

      {showPhotoCapture && (
        <PhotoCapture
          onPhotoCapture={handlePhotoCapture}
          onClose={() => setShowPhotoCapture(false)}
        />
      )}
    </div>
  );
};

export default EmployeeForm;