import React, { useState, useEffect } from 'react';
import { X, Edit, Printer, MapPin, User, Wrench, Package, Building, Phone, Mail, Calendar } from 'lucide-react';
import { generateQRCode } from '../../utils/qrCodeUtils';
import { DataStorage } from '../../utils/dataStorage';
import { generateEmployeeIDCard } from '../../utils/employeeIDCardGenerator';
import { generateIDCardPDF } from '../../utils/pdfUtils';

interface ProfileViewProps {
  entity: any;
  entityType: string;
  onClose: () => void;
  onEdit: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ entity, entityType, onClose, onEdit }) => {
  const [qrCodeImage, setQrCodeImage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [sites, setSites] = useState<any[]>([]);
  
  useEffect(() => {
    generateQR();
    loadSites();
  }, [entity]);
  
  const loadSites = () => {
    setSites(DataStorage.loadSites());
  };

  const generateQR = async () => {
    setIsLoading(true);
    try {
      const qrData = entity.qrCode || entity.id;
      const qrImage = await generateQRCode(qrData);
      setQrCodeImage(qrImage);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    if (entityType === 'employee') {
      generateEmployeeIDCard(entity, qrCodeImage);
    } else {
      generateIDCardPDF(entity, qrCodeImage, entityType);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrCodeImage;
    link.download = `${entityType}-${entity.id}-qrcode.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSiteName = (siteId: string) => {
    const site = sites.find(s => s.id === siteId);
    return site ? site.name : 'Unknown Site';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
      case 'down':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'in-use':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'maintenance':
      case 'low-stock':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'out-of-stock':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEntityIcon = () => {
    switch (entityType) {
      case 'employee': return User;
      case 'equipment': return Wrench;
      case 'material': return Package;
      case 'site': return Building;
      default: return User;
    }
  };

  const EntityIcon = getEntityIcon();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <EntityIcon className={`w-6 h-6 ${
              entityType === 'employee' ? 'text-blue-600' :
              entityType === 'equipment' ? 'text-green-600' :
              entityType === 'material' ? 'text-orange-600' :
              'text-purple-600'
            }`} />
            <h2 className="text-xl font-semibold text-gray-900">
              {entityType.charAt(0).toUpperCase() + entityType.slice(1)} Profile
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column - QR Code */}
            <div className="md:col-span-1">
              <div className="bg-gray-50 rounded-lg p-6 flex flex-col items-center">
                {isLoading ? (
                  <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <img 
                    src={qrCodeImage} 
                    alt={`QR Code for ${entity.name}`} 
                    className="w-48 h-48 border-2 border-gray-200 rounded-lg"
                  />
                )}
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500">ID: {entity.id}</p>
                  <div className="flex space-x-2 mt-4">
                    <button
                      onClick={handlePrint}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Print</span>
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{entity.name}</h3>
                    {entityType === 'employee' && (
                      <p className="text-gray-600">{entity.position} • {entity.department}</p>
                    )}
                    {entityType === 'equipment' && (
                      <p className="text-gray-600">{entity.type} • {entity.model}</p>
                    )}
                    {entityType === 'material' && (
                      <p className="text-gray-600">{entity.type} • {entity.quantity} {entity.unit}</p>
                    )}
                    {entityType === 'site' && (
                      <p className="text-gray-600">{entity.type || 'Site'} • {entity.province}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {entity.status && (
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(entity.status)}`}>
                        {entity.status.toUpperCase()}
                      </span>
                    )}
                    <button
                      onClick={onEdit}
                      className="flex items-center space-x-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Employee-specific details */}
                  {entityType === 'employee' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Department</h4>
                          <p className="text-gray-900">{entity.department}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Position</h4>
                          <p className="text-gray-900">{entity.position}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Site</h4>
                          <p className="text-gray-900">{getSiteName(entity.site)}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Type</h4>
                          <p className="text-gray-900">{entity.type || 'Not specified'}</p>
                        </div>
                        {entity.bloodGroup && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Blood Group</h4>
                            <p className="text-gray-900">{entity.bloodGroup}</p>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <h4 className="text-sm font-medium text-gray-500 mb-3">Contact Information</h4>
                        <div className="space-y-2">
                          {entity.email && (
                            <div className="flex items-center space-x-2">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-900">{entity.email}</span>
                            </div>
                          )}
                          {entity.phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-900">{entity.phone}</span>
                            </div>
                          )}
                          {!entity.email && !entity.phone && (
                            <p className="text-gray-500">No contact information provided</p>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Equipment-specific details */}
                  {entityType === 'equipment' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Type</h4>
                          <p className="text-gray-900">{entity.type}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Model</h4>
                          <p className="text-gray-900">{entity.model}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Site</h4>
                          <p className="text-gray-900">{getSiteName(entity.site)}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
                          <p className="text-gray-900">{entity.status}</p>
                        </div>
                        {entity.serialNumber && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Serial Number</h4>
                            <p className="text-gray-900">{entity.serialNumber}</p>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <h4 className="text-sm font-medium text-gray-500 mb-3">Registration Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Created</h4>
                            <p className="text-gray-900">{new Date(entity.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Last Updated</h4>
                            <p className="text-gray-900">{new Date(entity.lastUpdated).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Material-specific details */}
                  {entityType === 'material' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Type</h4>
                          <p className="text-gray-900">{entity.type}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Unit</h4>
                          <p className="text-gray-900">{entity.unit}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Quantity</h4>
                          <p className="text-gray-900">{entity.quantity} {entity.unit}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Site</h4>
                          <p className="text-gray-900">{getSiteName(entity.site)}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Status</h4>
                          <p className="text-gray-900">{entity.status}</p>
                        </div>
                      </div>

                      {entity.use && (
                        <div className="border-t border-gray-200 pt-4 mt-4">
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Usage Description</h4>
                          <p className="text-gray-900">{entity.use}</p>
                        </div>
                      )}

                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <h4 className="text-sm font-medium text-gray-500 mb-3">Registration Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Created</h4>
                            <p className="text-gray-900">{new Date(entity.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Last Updated</h4>
                            <p className="text-gray-900">{new Date(entity.lastUpdated).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Site-specific details */}
                  {entityType === 'site' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Province</h4>
                          <p className="text-gray-900">{entity.province}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Manager</h4>
                          <p className="text-gray-900">{entity.manager}</p>
                        </div>
                        <div className="col-span-2">
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Address</h4>
                          <p className="text-gray-900">{entity.address}</p>
                        </div>
                        <div className="col-span-2">
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Coordinates</h4>
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <p className="text-gray-900">
                              {entity.coordinates[1].toFixed(4)}, {entity.coordinates[0].toFixed(4)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <h4 className="text-sm font-medium text-gray-500 mb-3">Registration Information</h4>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Last Updated</h4>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <p className="text-gray-900">{new Date(entity.lastUpdated).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;