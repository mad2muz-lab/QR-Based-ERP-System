import React, { useState } from 'react';
import { Building, Edit, Trash2, Printer, MapPin } from 'lucide-react';
import { Site } from '../../../types';
import { generateQRCode } from '../../../utils/qrCodeUtils';
import QRCodeDisplay from '../QRCodeDisplay';

interface SiteListProps {
  sites: Site[];
  onEdit: (site: Site) => void;
  onDelete: (id: string) => void;
}

const SiteList: React.FC<SiteListProps> = ({ sites, onEdit, onDelete }) => {
  const [showQRCode, setShowQRCode] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);

  if (sites.length === 0) {
    return (
      <div className="text-center py-8">
        <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No sites registered yet.</p>
        <p className="text-sm text-gray-400">Register your first site to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-900">Registered Sites ({sites.length})</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sites.map(site => (
          <div key={site.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Building className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h5 className="font-medium text-gray-900">{site.name}</h5>
                  <p className="text-sm text-gray-500">{site.type}</p>
                </div>
              </div>
              
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>

            <div className="space-y-1 text-sm text-gray-600 mb-4">
              <div><span className="font-medium">Province:</span> {site.province}</div>
              <div><span className="font-medium">Manager:</span> {site.manager}</div>
              <div className="flex items-center space-x-1">
                <MapPin className="w-3 h-3" />
                <span>
                  {typeof site.coordinates[1] === 'number' ? site.coordinates[1].toFixed(4) : 'N/A'},
                  {typeof site.coordinates[0] === 'number' ? site.coordinates[0].toFixed(4) : 'N/A'}
                </span>
              </div>
              <div><span className="font-medium">ID:</span> <code className="bg-gray-100 px-1 rounded">{site.id}</code></div>
              <div className="text-xs text-gray-500 mt-2">{site.address}</div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(site)}
                className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
              
              <button
                onClick={() => {
                  setSelectedSite(site);
                  setShowQRCode(true);
                }}
                className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>QR Code</span>
              </button>
              
              <button
                onClick={() => onDelete(site.id)}
                className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* QR Code Modal */}
      {showQRCode && selectedSite && (
        <QRCodeDisplay
          entity={selectedSite}
          entityType="site"
          onClose={() => setShowQRCode(false)}
        />
      )}
    </div>
  );
};

export default SiteList;