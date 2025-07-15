import React, { useState } from 'react';
import { Package, Edit, Trash2, Printer } from 'lucide-react';
import { Material } from '../../../types';
import { generateQRCode } from '../../../utils/qrCodeUtils';
import QRCodeDisplay from '../QRCodeDisplay';

interface MaterialListProps {
  materials: Material[];
  sites: any[];
  onEdit: (material: Material) => void;
  onDelete: (id: string) => void;
}

const MaterialList: React.FC<MaterialListProps> = ({ materials, sites, onEdit, onDelete }) => {
  const [showQRCode, setShowQRCode] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  const getSiteName = (siteId: string) => {
    const site = sites.find(s => s.id === siteId);
    return site ? site.name : 'Unknown Site';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'low-stock': return 'bg-yellow-100 text-yellow-800';
      case 'out-of-stock': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (materials.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No materials registered yet.</p>
        <p className="text-sm text-gray-400">Register your first material to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-900">Registered Materials ({materials.length})</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {materials.map(material => (
          <div key={material.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h5 className="font-medium text-gray-900">{material.name}</h5>
                  <p className="text-sm text-gray-500">{material.type}</p>
                </div>
              </div>
              
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(material.status)}`}>
                {material.status}
              </span>
            </div>

            <div className="space-y-1 text-sm text-gray-600 mb-4">
              <div><span className="font-medium">Quantity:</span> {material.quantity} {material.unit}</div>
              <div><span className="font-medium">Site:</span> {getSiteName(material.site)}</div>
              <div><span className="font-medium">ID:</span> <code className="bg-gray-100 px-1 rounded">{material.id}</code></div>
              {material.oldId && (
                <div><span className="font-medium">Legacy ID:</span> <code className="bg-yellow-100 px-1 rounded text-yellow-800">{material.oldId}</code></div>
              )}
              {material.use && (
                <div><span className="font-medium">Use:</span> {material.use}</div>
              )}
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(material)}
                className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
              
              <button
                onClick={() => {
                  setSelectedMaterial(material);
                  setShowQRCode(true);
                }}
                className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>QR Code</span>
              </button>
              
              <button
                onClick={() => onDelete(material.id)}
                className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* QR Code Modal */}
      {showQRCode && selectedMaterial && (
        <QRCodeDisplay
          entity={selectedMaterial}
          entityType="material"
          onClose={() => setShowQRCode(false)}
        />
      )}
    </div>
  );
};

export default MaterialList;