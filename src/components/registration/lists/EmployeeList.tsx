import React, { useState } from 'react';
import { User, Edit, Trash2, Printer, Eye } from 'lucide-react';
import { Employee } from '../../../types';
import { generateQRCode } from '../../../utils/qrCodeUtils';
import QRCodeDisplay from '../QRCodeDisplay';

interface EmployeeListProps {
  employees: Employee[];
  sites: any[];
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
}

const EmployeeList: React.FC<EmployeeListProps> = ({ employees, sites, onEdit, onDelete }) => {
  const [showQRCode, setShowQRCode] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const getSiteName = (siteId: string) => {
    const site = sites.find(s => s.id === siteId);
    return site ? site.name : 'Unknown Site';
  };

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  if (employees.length === 0) {
    return (
      <div className="text-center py-8">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No employees registered yet.</p>
        <p className="text-sm text-gray-400">Register your first employee to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-900">Registered Employees ({employees.length})</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map(employee => (
          <div key={employee.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                {employee.photo ? (
                  <img
                    src={employee.photo}
                    alt={employee.name}
                    className="w-12 h-12 object-cover rounded-full border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <div>
                  <h5 className="font-medium text-gray-900">{employee.name}</h5>
                  <p className="text-sm text-gray-500">{employee.department}</p>
                </div>
              </div>
              
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(employee.status)}`}>
                {employee.status}
              </span>
            </div>

            <div className="space-y-1 text-sm text-gray-600 mb-4">
              <div><span className="font-medium">Position:</span> {employee.position}</div>
              <div><span className="font-medium">Type:</span> {employee.type || 'Not specified'}</div>
              <div><span className="font-medium">Site:</span> {getSiteName(employee.site)}</div>
              <div><span className="font-medium">ID:</span> <code className="bg-gray-100 px-1 rounded">{employee.id}</code></div>
              {employee.bloodGroup && (
                <div><span className="font-medium">Blood Group:</span> {employee.bloodGroup}</div>
              )}
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(employee)}
                className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
              
              <button
                onClick={() => {
                  setSelectedEmployee(employee);
                  setShowQRCode(true);
                }}
                className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>ID Card</span>
              </button>
              
              <button
                onClick={() => onDelete(employee.id)}
                className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* QR Code Modal */}
      {showQRCode && selectedEmployee && (
        <QRCodeDisplay
          entity={selectedEmployee}
          entityType="employee"
          onClose={() => setShowQRCode(false)}
        />
      )}
    </div>
  );
};

export default EmployeeList;