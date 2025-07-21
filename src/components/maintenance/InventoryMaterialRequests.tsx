import React from 'react';

const InventoryMaterialRequests = ({ materialRequests, handleIssueMaterials, handleReadyToUse }: {
  materialRequests: any[];
  handleIssueMaterials: (request: any) => void;
  handleReadyToUse: (request: any) => void;
}) => (
  <div className="bg-white rounded-lg shadow p-6 mt-6">
    <h2 className="text-xl font-bold mb-4 flex items-center">
      <span className="w-5 h-5 text-purple-600 mr-2">📊</span>
      Inventory Material Requests
    </h2>
    <p className="text-sm text-gray-600 mb-4">Requests for materials that are awaiting inventory or pending service.</p>
    {materialRequests.filter(r => r.status === 'awaiting_inventory' || r.status === 'pending_service').length === 0 ? (
      <p className="text-gray-500 text-center py-4">No material requests awaiting inventory or pending service.</p>
    ) : (
      <ul className="space-y-4">
        {materialRequests.filter(r => r.status === 'awaiting_inventory' || r.status === 'pending_service').map(request => (
          <li key={request.id} className="border rounded p-4">
            <div className="mb-2 font-semibold">Equipment: {request.equipment_name}</div>
            <div className="mb-2">Class: {request.maintenance_class} | Type: {request.maintenance_type}</div>
            <div className="mb-2">Requested By: {request.requested_by}</div>
            <div className="mb-2">Materials:</div>
            <ul className="ml-4 list-disc">
              {(request.items || []).map((item: any, idx: number) => (
                <li key={idx}>{item.material_name} ({item.quantity_requested} {item.uom})</li>
              ))}
            </ul>
            {request.status === 'awaiting_inventory' && (
              <button onClick={() => handleIssueMaterials(request)} className="mt-4 px-4 py-2 bg-green-600 text-white rounded">Issue</button>
            )}
            {request.status === 'pending_service' && (
              <button onClick={() => handleReadyToUse(request)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Ready to Use</button>
            )}
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default InventoryMaterialRequests; 