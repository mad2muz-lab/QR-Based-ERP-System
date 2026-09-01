// src/components/common/DataSourceToggle.tsx
import React, { useState, useEffect } from 'react';
import DataSource from '../../services/DataSource';

interface DataSourceToggleProps {
  className?: string;
}

const DataSourceToggle: React.FC<DataSourceToggleProps> = ({ className = '' }) => {
  const [currentSource, setCurrentSource] = useState<string>('supabase');

  useEffect(() => {
    // Initialize and get current source
    DataSource.init();
    setCurrentSource(DataSource.get());
  }, []);

  const handleSourceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newSource = event.target.value;
    DataSource.set(newSource);
    setCurrentSource(newSource);
    
    // Trigger a page reload to ensure all components use the new data source
    window.location.reload();
  };

  return (
    <div className={`data-source-toggle ${className}`}>
      <label htmlFor="data-source-select" className="block text-sm font-medium text-gray-700 mb-1">
        Data Source:
      </label>
      <select
        id="data-source-select"
        value={currentSource}
        onChange={handleSourceChange}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      >
        <option value="supabase">Cloud Database</option>
        <option value="localstorage">Local Storage</option>
      </select>
      <p className="mt-1 text-xs text-gray-500">
        Current: {currentSource === 'supabase' ? 'Cloud Database' : 'Local Storage'}
      </p>
    </div>
  );
};

export default DataSourceToggle;