import React, { useState, useEffect } from 'react';
import { User, Camera, Trash2, AlertCircle, X } from 'lucide-react';
import { Employee } from '../../../types';
import { employeeTypes, EmployeeTypeManager } from '../../../data/materialTypes';
import { DataStorage } from '../../../utils/dataStorage';
import { AuthManager } from '../../../utils/authUtils';
import PhotoCapture from '../PhotoCapture';
import { generateQRCode } from '../../../utils/qrCodeUtils';
import { SupabaseRegistrationService } from '../../../utils/supabaseRegistrationService';

interface EmployeeFormProps {
  sites: any[];
  onSubmit: (employee: Omit<Employee, 'createdAt' | 'qrCode'>, isEdit?: boolean) => void;
  initialData?: Employee | null;
  onClose?: () => void;
}

interface Company {
  id: string;
  name: string;
  logourl?: string;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ sites, onSubmit, initialData, onClose }) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    type: '',
    customType: '',
    department: '',
    position: '',
    bloodGroup: '',
    site: '',
    status: 'active' as 'active' | 'inactive',
    photo: '',
    email: '',
    phone: '',
    oldId: '',
    companyId: ''
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
  const [companies, setCompanies] = useState<Company[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isEditMode = !!initialData;

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
        phone: initialData.phone || '',
        oldId: initialData.oldId || '',
        companyId: initialData.companyId || ''
      });
      
      const allTypes = EmployeeTypeManager.getAllEmployeeTypesWithCodes();
      const isCustomType = !allTypes.some((t: { code: string; name: string }) => t.name === initialData.type);
      setShowCustomType(isCustomType);
      if (isCustomType) {
        setFormData(prev => ({ ...prev, customType: initialData.type || '' }));
      }
    } else {
      // Reset form for new employees
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
        phone: '',
        oldId: '',
        companyId: ''
      });
      setShowCustomType(false);
      setIdError('');
    }
  }, [initialData]);

  useEffect(() => {
    if (formData.id.trim() === '') {
      setIdError('');
      return;
    }

    // Skip validation for edit mode
    if (isEditMode) {
      setIdError('');
      return;
    }

    // Validate EMP- prefix
    if (!formData.id.startsWith('EMP-')) {
      setIdError('Employee ID must start with "EMP-" (e.g., EMP-001)');
      return;
    }

    // Validate format: EMP- followed by alphanumeric characters
    const idPattern = /^EMP-[A-Za-z0-9]+$/;
    if (!idPattern.test(formData.id)) {
      setIdError('Employee ID must follow format: EMP-XXX (e.g., EMP-001, EMP-ABC)');
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
  }, [formData.id, isEditMode]);

  useEffect(() => {
    loadDepartments();
    setCurrentUser(AuthManager.getCurrentUser());
    // Fetch companies from Supabase
    SupabaseRegistrationService.getCompanies().then(result => {
      if (result.success && result.data) setCompanies(result.data);
      else setCompanies([]);
    });
  }, []);

  const loadDepartments = () => {
    const loadedDepartments = DataStorage.loadDepartments();
    setDepartments(loadedDepartments);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) {
      return;
    }
    
    setIsSubmitting(true);
    
    // Validate required fields
    if (!formData.id.trim()) {
      setIdError('Employee ID is required');
      setIsSubmitting(false);
      return;
    }

    if (idError) {
      setIsSubmitting(false);
      return;
    }

    try {
      // Generate QR code using the full user-provided ID (already includes EMP- prefix)
      const qrCode = await generateQRCode(formData.id);
      setQrCodeImage(qrCode);
      
      let finalType = formData.type;
      
      if (showCustomType && formData.customType.trim()) {
        const addedType = EmployeeTypeManager.addCustomType(formData.customType.trim());
        finalType = addedType.name;
      }
      
      const employeeData = {
        ...formData,
        type: finalType,
        lastUpdated: new Date().toISOString()
      };
      
      const { customType, ...finalData } = employeeData;
      
      onSubmit(finalData, isEditMode);
      setMessage({ type: 'success', text: isEditMode ? 'Employee updated successfully!' : 'Employee added successfully!' });
      // Only reset form if not editing
      if (!isEditMode) {
        setFormData({
          id: '', name: '', type: '', customType: '', department: '', position: '', bloodGroup: '', site: '', status: 'active', photo: '', email: '', phone: '', oldId: '', companyId: ''
        });
        setShowCustomType(false);
        setIdError('');
      }
      
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to register employee. Please try again.' });
      setIsSubmitting(false);
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
    <div className="relative space-y-6 w-full max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto px-2 sm:px-6 md:px-8">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute top-0 right-0 mt-2 mr-2 text-gray-400 hover:text-gray-700"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>
      )}
      {message && (
        <div className={`mb-4 px-4 py-2 rounded text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>
      )}
      <div className="flex items-center space-x-3 mb-6">
        <User className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Register New Employee</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Employee ID Input */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employee ID *
            </label>
            <input
              type="text"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base ${
                idError ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter Employee ID (e.g., EMP-001)"
              required
              disabled={isEditMode}
            />
            {isCheckingId && (
              <div className="text-sm text-blue-600 mt-1">
                Checking availability...
              </div>
            )}
            {idError && (
              <div className="text-sm text-red-600 mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {idError}
              </div>
            )}
            {!idError && formData.id && !isCheckingId && !isEditMode && (
              <div className="text-sm text-green-600 mt-1">
                ✓ ID is available
              </div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              Employee ID must start with "EMP-" followed by alphanumeric characters (e.g., EMP-001, EMP-ABC).
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Old Employee ID (Optional)</label>
            <input
              type="text"
              value={formData.oldId}
              onChange={(e) => setFormData({ ...formData, oldId: e.target.value })}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="Enter legacy employee ID from previous system"
            />
            <div className="text-xs text-gray-500 mt-1">
              Enter the employee ID from your previous system for backward compatibility and audit purposes.
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
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
                  className="flex-1 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
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
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                required
              >
                <option value="">Select employee type</option>
                {EmployeeTypeManager.getAllEmployeeTypesWithCodes().map((type: { code: string; name: string }) => (
                  <option key={type.code} value={type.name}>{type.code}-{type.name}</option>
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
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
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
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
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
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
            <select
              value={formData.bloodGroup}
              onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
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
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="employee@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              placeholder="000-000-0000"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Company</label>
            <select
              value={formData.companyId}
              onChange={e => setFormData({ ...formData, companyId: e.target.value })}
              className="border px-3 py-3 rounded w-full text-base"
            >
              <option value="">Select company</option>
              {companies.map((company: Company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site Assignment *</label>
            <select
              value={formData.site}
              onChange={(e) => setFormData({ ...formData, site: e.target.value })}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
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
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Employee Photo</label>
          {formData.photo ? (
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img
                  src={formData.photo}
                  alt="Employee"
                  className="w-24 h-24 object-cover rounded-lg border-2 border-gray-300"
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
          ) :
            <button
              type="button"
              onClick={() => setShowPhotoCapture(true)}
              className="flex items-center space-x-2 px-4 py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors w-full h-32 justify-center"
            >
              <div className="text-center">
                <Camera className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <span className="text-gray-600 block">Add Employee Photo</span>
                <span className="text-xs text-gray-500 block mt-1">Click to capture or upload</span>
              </div>
            </button>
          }
        </div>

        <button
          type="submit"
          disabled={!!idError || (isCheckingId && !isEditMode) || !formData.id.trim() || isSubmitting}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg font-semibold mt-2"
        >
          {isSubmitting ? (isEditMode ? 'Updating...' : 'Registering...') : (isEditMode ? 'Update Employee' : 'Register Employee')}
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