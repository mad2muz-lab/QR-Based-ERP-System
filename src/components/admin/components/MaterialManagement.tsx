import React from 'react';
import { Package } from 'lucide-react';
import { useMaterials } from '../hooks/useMaterials';

const MaterialManagement: React.FC = () => {
  const {
    materials,
    materialLogFormData,
    setMaterialLogFormData,
    isLoading,
    handleSubmitLog
  } = useMaterials();

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Package className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Material Inventory Management</h2>
        </div>
      </div>

      {/* Material Log Form */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add Material Log</h3>
        <form onSubmit={handleSubmitLog} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
            <select
              value={materialLogFormData.material_id}
              onChange={(e) => setMaterialLogFormData({...materialLogFormData, material_id: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select Material</option>
              {materials.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.name} (Current: {material.quantity} {material.unit})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
            <select
              value={materialLogFormData.transaction_type}
              onChange={(e) => setMaterialLogFormData({...materialLogFormData, transaction_type: e.target.value as 'add' | 'remove'})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="add">Add Stock</option>
              <option value="remove">Remove Stock</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              min="1"
              value={materialLogFormData.quantity}
              onChange={(e) => setMaterialLogFormData({...materialLogFormData, quantity: Number(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Adding...' : 'Add Log'}
            </button>
          </div>
        </form>
      </div>

      {/* Materials Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">Material ID</th>
              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">Type</th>
              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">Quantity</th>
              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">Unit</th>
              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">Site</th>
              <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((material) => (
              <tr key={material.id} className="hover:bg-gray-50">
                <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900 font-mono">
                  {material.id}
                </td>
                <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
                  {material.name}
                </td>
                <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
                  {material.type}
                </td>
                <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900 font-semibold">
                  {material.quantity}
                </td>
                <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
                  {material.unit}
                </td>
                <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
                  {material.site}
                </td>
                <td className="border border-gray-200 px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    material.status === 'available' ? 'bg-green-100 text-green-800' :
                    material.status === 'low-stock' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {material.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {materials.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No materials found.
          </div>
        )}
      </div>
    </div>
  );
};

export default MaterialManagement;