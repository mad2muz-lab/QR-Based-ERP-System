import React, { useState, useEffect } from 'react';
import { User, Camera, Trash2, AlertCircle, X, Plus, Minus, CreditCard, Calendar, Phone, GraduationCap, Award, Heart, Shield } from 'lucide-react';
import { Employee } from '../../../types';
// import { employeeTypes, EmployeeTypeManager } from '../../../data/materialTypes';
import { DataStorage } from '../../../utils/dataStorage';
import { AuthManager } from '../../../utils/authUtils';
// import PhotoCapture from '../PhotoCapture';
// import { generateQRCode } from '../../../utils/qrCodeUtils';
// import { SupabaseRegistrationService } from '../../../utils/supabaseRegistrationService';
// import { CostProfitCenterService } from '../../../utils/costProfitCenterService';

interface EnhancedEmployeeFormProps {
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

const EnhancedEmployeeForm: React.FC<EnhancedEmployeeFormProps> = ({ sites, onSubmit, initialData, onClose }) => {
  console.log('🚀 EnhancedEmployeeForm component is loading...');
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Information (Step 1)
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
    companyId: '',
    costCenterCode: '',
    profitCenterCode: '',
    
    // HR Extended Data (Step 2)
    hrData: {
      // Personal Information
      dateOfBirth: '',
      nationality: '',
      maritalStatus: 'single' as 'single' | 'married' | 'divorced' | 'widowed',
      gender: 'male' as 'male' | 'female' | 'other',
      
      // Employment Details
      employmentType: 'full-time' as 'full-time' | 'part-time' | 'contract' | 'temporary',
      startDate: '',
      supervisor: '',
      workLocation: '',
      
      // Payroll Information
      baseSalary: 0,
      currency: 'SAR',
      bankAccount: '',
      bankName: '',
      taxStatus: '',
      deductions: [] as string[],
      
      // Leave Information
      annualLeaveEntitlement: 25,
      sickLeaveBalance: 30,
      leaveAccrualRate: 2.08,
      
      // Emergency Contacts
      emergencyContacts: [] as Array<{
        name: string;
        relationship: string;
        phone: string;
        email: string;
      }>,
      
      // Educational Background
      education: [] as Array<{
        level: string;
        institution: string;
        field: string;
        yearCompleted: string;
        certificate: string;
      }>,
      
      // Skills & Certifications
      skills: [] as Array<{
        skill: string;
        level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
        certified: boolean;
        certificationDate: string;
      }>,
      
      // Medical Information
      medicalInfo: {
        bloodType: '',
        allergies: [] as string[],
        medicalConditions: [] as string[],
        emergencyContact: ''
      },
      
      // Benefits
      benefits: {
        healthInsurance: true,
        lifeInsurance: false,
        retirementPlan: false,
        otherBenefits: [] as string[]
      }
    }
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
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [profitCenters, setProfitCenters] = useState<any[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isEditMode = !!initialData;

  // Predefined options for closed selections
  const nationalityOptions = ['Saudi', 'Egyptian', 'Indian', 'Pakistani', 'Filipino', 'Other'];
  const bankOptions = ['Saudi National Bank', 'Al Rajhi Bank', 'Riyad Bank', 'Arab National Bank', 'Bank Aljazira', 'Other'];
  const taxStatusOptions = ['Single', 'Married', 'Head of Household', 'Other'];
  const deductionOptions = ['Health Insurance', 'Life Insurance', 'Retirement Plan', 'Loan Payment', 'Other'];
  const educationLevels = ['High School', 'Diploma', 'Bachelor\'s Degree', 'Master\'s Degree', 'PhD', 'Other'];
  const skillLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
  const commonSkills = ['Project Management', 'AutoCAD', 'MS Office', 'SAP', 'Oracle', 'Welding', 'Electrical', 'Mechanical', 'Safety', 'Leadership'];

       useEffect(() => {
       loadInitialData();
       loadDepartments();
       // loadCompanies();
       // loadCostProfitCenters();
     }, []);

  const loadInitialData = () => {
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
        companyId: initialData.companyId || '',
        costCenterCode: initialData.costCenterCode || '',
        profitCenterCode: initialData.profitCenterCode || '',
        hrData: {
          ...formData.hrData,
          ...initialData.hrData
        }
      });
    }
  };

  const loadDepartments = async () => {
    const loadedDepartments = DataStorage.loadDepartments();
    setDepartments(loadedDepartments);
  };

       // const loadCompanies = async () => {
     //   try {
     //     const useSupabase = await AuthManager.useSupabase();
     //     if (useSupabase) {
     //       const companies = await SupabaseRegistrationService.getCompanies();
     //       setCompanies(companies);
     //     } else {
     //       const companies = DataStorage.loadCompanies();
     //       setCompanies(companies);
     //     }
     //   } catch (error) {
     //     console.error('Error loading companies:', error);
     //   }
     // };

     // const loadCostProfitCenters = async () => {
     //   try {
     //     const costCenters = await CostProfitCenterService.getCostCenters();
     //     const profitCenters = await CostProfitCenterService.getProfitCenters();
     //     setCostCenters(costCenters);
     //     setProfitCenters(profitCenters);
     //   } catch (error) {
     //     console.error('Error loading centers:', error);
     //   }
     // };

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
           try {
         // const qrCode = await generateQRCode(formData.id);
         // setQrCodeImage(qrCode);

         let finalType = formData.type;
         // if (showCustomType && formData.customType.trim()) {
         //   const addedType = EmployeeTypeManager.addCustomType(formData.customType.trim());
         //   finalType = addedType.name;
         // }
      
      const employeeData = {
        ...formData,
        type: finalType,
        lastUpdated: new Date().toISOString()
      };
      
      const { customType, ...finalData } = employeeData;
      
      onSubmit(finalData, isEditMode);
      setMessage({ type: 'success', text: isEditMode ? 'Employee updated successfully!' : 'Employee registered successfully!' });
      
      if (!isEditMode) {
        // Reset form
        setFormData({
          id: '', name: '', type: '', customType: '', department: '', position: '', bloodGroup: '', site: '', status: 'active', photo: '', email: '', phone: '', oldId: '', companyId: '', costCenterCode: '', profitCenterCode: '',
          hrData: {
            dateOfBirth: '', nationality: '', maritalStatus: 'single', gender: 'male',
            employmentType: 'full-time', startDate: '', supervisor: '', workLocation: '',
            baseSalary: 0, currency: 'SAR', bankAccount: '', bankName: '', taxStatus: '', deductions: [],
            annualLeaveEntitlement: 25, sickLeaveBalance: 30, leaveAccrualRate: 2.08,
            emergencyContacts: [], education: [], skills: [],
            medicalInfo: { bloodType: '', allergies: [], medicalConditions: [], emergencyContact: '' },
            benefits: { healthInsurance: true, lifeInsurance: false, retirementPlan: false, otherBenefits: [] }
          }
        });
        setCurrentStep(1);
      }
      
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to register employee. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addEmergencyContact = () => {
    setFormData(prev => ({
      ...prev,
      hrData: {
        ...prev.hrData,
        emergencyContacts: [...prev.hrData.emergencyContacts, { name: '', relationship: '', phone: '', email: '' }]
      }
    }));
  };

  const removeEmergencyContact = (index: number) => {
    setFormData(prev => ({
      ...prev,
      hrData: {
        ...prev.hrData,
        emergencyContacts: prev.hrData.emergencyContacts.filter((_, i) => i !== index)
      }
    }));
  };

  const updateEmergencyContact = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      hrData: {
        ...prev.hrData,
        emergencyContacts: prev.hrData.emergencyContacts.map((contact, i) => 
          i === index ? { ...contact, [field]: value } : contact
        )
      }
    }));
  };

  const toggleDeduction = (deduction: string) => {
    setFormData(prev => ({
      ...prev,
      hrData: {
        ...prev.hrData,
        deductions: prev.hrData.deductions.includes(deduction)
          ? prev.hrData.deductions.filter(d => d !== deduction)
          : [...prev.hrData.deductions, deduction]
      }
    }));
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center">
        <User className="mr-2" />
        Basic Information
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
          <input
            type="text"
            value={formData.id}
            onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="EMP-001"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="John Doe"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="john.doe@company.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="+966 50 123 4567"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
          <select
            value={formData.department}
            onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Department</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.name}>{dept.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
          <input
            type="text"
            value={formData.position}
            onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Engineer"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Site *</label>
          <select
            value={formData.site}
            onChange={(e) => setFormData(prev => ({ ...prev, site: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Site</option>
            {sites.map((site) => (
              <option key={site.id} value={site.name}>{site.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
          <select
            value={formData.bloodGroup}
            onChange={(e) => setFormData(prev => ({ ...prev, bloodGroup: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Blood Group</option>
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
      </div>
      
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleNextStep}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Next: Employment Details
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center">
        <CreditCard className="mr-2" />
        Employment & Payroll Information
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type *</label>
          <select
            value={formData.hrData.employmentType}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              hrData: { ...prev.hrData, employmentType: e.target.value as any }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="full-time">Full Time</option>
            <option value="part-time">Part Time</option>
            <option value="contract">Contract</option>
            <option value="temporary">Temporary</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
          <input
            type="date"
            value={formData.hrData.startDate}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              hrData: { ...prev.hrData, startDate: e.target.value }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Base Salary *</label>
          <input
            type="number"
            value={formData.hrData.baseSalary}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              hrData: { ...prev.hrData, baseSalary: parseFloat(e.target.value) || 0 }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="5000"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
          <select
            value={formData.hrData.currency}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              hrData: { ...prev.hrData, currency: e.target.value }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="SAR">SAR</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
          <select
            value={formData.hrData.bankName}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              hrData: { ...prev.hrData, bankName: e.target.value }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Bank</option>
            {bankOptions.map(bank => (
              <option key={bank} value={bank}>{bank}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account Number</label>
          <input
            type="text"
            value={formData.hrData.bankAccount}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              hrData: { ...prev.hrData, bankAccount: e.target.value }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="1234567890"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tax Status</label>
          <select
            value={formData.hrData.taxStatus}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              hrData: { ...prev.hrData, taxStatus: e.target.value }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Tax Status</option>
            {taxStatusOptions.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Annual Leave Entitlement</label>
          <input
            type="number"
            value={formData.hrData.annualLeaveEntitlement}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              hrData: { ...prev.hrData, annualLeaveEntitlement: parseInt(e.target.value) || 0 }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="25"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Deductions</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {deductionOptions.map(deduction => (
            <label key={deduction} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.hrData.deductions.includes(deduction)}
                onChange={() => toggleDeduction(deduction)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{deduction}</span>
            </label>
          ))}
        </div>
      </div>
      
      <div className="flex justify-between">
        <button
          type="button"
          onClick={handlePrevStep}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={handleNextStep}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Next: Personal Information
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center">
        <User className="mr-2" />
        Personal Information & Emergency Contacts
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
          <input
            type="date"
            value={formData.hrData.dateOfBirth}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              hrData: { ...prev.hrData, dateOfBirth: e.target.value }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
          <select
            value={formData.hrData.nationality}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              hrData: { ...prev.hrData, nationality: e.target.value }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Nationality</option>
            {nationalityOptions.map(nationality => (
              <option key={nationality} value={nationality}>{nationality}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
          <select
            value={formData.hrData.maritalStatus}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              hrData: { ...prev.hrData, maritalStatus: e.target.value as any }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="single">Single</option>
            <option value="married">Married</option>
            <option value="divorced">Divorced</option>
            <option value="widowed">Widowed</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
          <select
            value={formData.hrData.gender}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              hrData: { ...prev.hrData, gender: e.target.value as any }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      
      <div>
        <div className="flex justify-between items-center mb-4">
          <label className="block text-sm font-medium text-gray-700">Emergency Contacts</label>
          <button
            type="button"
            onClick={addEmergencyContact}
            className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Contact
          </button>
        </div>
        
        {formData.hrData.emergencyContacts.map((contact, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 border border-gray-200 rounded-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={contact.name}
                onChange={(e) => updateEmergencyContact(index, 'name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Contact Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
              <input
                type="text"
                value={contact.relationship}
                onChange={(e) => updateEmergencyContact(index, 'relationship', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Spouse, Parent, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={contact.phone}
                onChange={(e) => updateEmergencyContact(index, 'phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+966 50 123 4567"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => removeEmergencyContact(index)}
                className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between">
        <button
          type="button"
          onClick={handlePrevStep}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Previous
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Registering...' : 'Complete Registration'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {isEditMode ? 'Edit Employee' : 'Enhanced Employee Registration'}
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
          }`}>
            1
          </div>
          <div className={`w-16 h-1 ${
            currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'
          }`}></div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
          }`}>
            2
          </div>
          <div className={`w-16 h-1 ${
            currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-300'
          }`}></div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
          }`}>
            3
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </form>

      {message && (
        <div className={`mt-4 p-4 rounded-md ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {qrCodeImage && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-lg font-semibold mb-2">Generated QR Code</h4>
          <img src={qrCodeImage} alt="Employee QR Code" className="w-32 h-32 mx-auto" />
        </div>
      )}
    </div>
  );
};

export default EnhancedEmployeeForm;
