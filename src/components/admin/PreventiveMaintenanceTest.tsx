import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Square, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Wrench,
  Database,
  Zap
} from 'lucide-react';
import { PreventiveMaintenanceService } from '../../utils/preventiveMaintenanceService';
import { DataStorage } from '../../utils/dataStorage';
import { OfflineDataManager } from '../../utils/offlineDataManager';

const PreventiveMaintenanceTest: React.FC = () => {
  const [isAutoChecking, setIsAutoChecking] = useState(false);
  const [equipmentUsage, setEquipmentUsage] = useState<any[]>([]);
  const [maintenanceSchedules, setMaintenanceSchedules] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const service = PreventiveMaintenanceService.getInstance();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load equipment usage data
      const usageData = await service.getAllEquipmentUsageData();
      setEquipmentUsage(usageData);

      // Load maintenance schedules
      const schedules = await OfflineDataManager.getAllMaintenanceSchedules();
      setMaintenanceSchedules(schedules);

    } catch (error) {
      console.error('Error loading test data:', error);
      addTestResult('❌ Error loading test data: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const startAutoCheck = () => {
    service.startAutoCheck(1); // Check every minute for testing
    setIsAutoChecking(true);
    addTestResult('✅ Started automatic preventive maintenance check (every 1 minute)');
  };

  const stopAutoCheck = () => {
    service.stopAutoCheck();
    setIsAutoChecking(false);
    addTestResult('⏹️ Stopped automatic preventive maintenance check');
  };

  const triggerManualCheck = async () => {
    try {
      setIsLoading(true);
      addTestResult('🔄 Triggering manual preventive maintenance check...');
      
      const newSchedules = await service.triggerManualCheck();
      
      if (newSchedules.length > 0) {
        addTestResult(`✅ Generated ${newSchedules.length} new maintenance schedules`);
        newSchedules.forEach(schedule => {
          addTestResult(`📋 Schedule: ${schedule.equipment_name} - ${schedule.maintenance_class} Class`);
        });
      } else {
        addTestResult('ℹ️ No new maintenance schedules needed');
      }
      
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Error in manual check:', error);
      addTestResult('❌ Error in manual check: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const testEquipmentUsageCalculation = async () => {
    try {
      setIsLoading(true);
      addTestResult('🔍 Testing equipment usage calculation...');
      
      const equipment = DataStorage.loadEquipment();
      if (equipment.length === 0) {
        addTestResult('⚠️ No equipment found in system');
        return;
      }

      const testEquipment = equipment[0];
      const usageHours = await service.calculateEquipmentUsageHours(testEquipment.id);
      
      addTestResult(`📊 Equipment "${testEquipment.name}" usage: ${usageHours} hours`);
      
      // Check if it needs maintenance
      const configs = await OfflineDataManager.getAllPreventiveMaintenanceConfigs();
      const config = configs.find(c => c.equipment_type === testEquipment.type && c.is_active);
      
      if (config) {
        const needsMaintenance = usageHours >= config.class_a_threshold_hours;
        addTestResult(`🔧 Needs Class A maintenance: ${needsMaintenance ? 'YES' : 'NO'} (threshold: ${config.class_a_threshold_hours}h)`);
      } else {
        addTestResult('⚠️ No maintenance configuration found for this equipment type');
      }
      
    } catch (error) {
      console.error('Error testing usage calculation:', error);
      addTestResult('❌ Error testing usage calculation: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const createTestEquipmentLog = async () => {
    try {
      setIsLoading(true);
      addTestResult('📝 Creating test equipment usage log...');
      
      const equipment = DataStorage.loadEquipment();
      if (equipment.length === 0) {
        addTestResult('⚠️ No equipment found in system');
        return;
      }

      const testEquipment = equipment[0];
      
      // Create a start-use log for 2 hours ago
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const now = new Date();
      
      const startLog = {
        id: `test-log-${Date.now()}`,
        equipmentId: testEquipment.id,
        equipmentName: testEquipment.name,
        equipmentType: testEquipment.type,
        action: 'start-use' as const,
        date: twoHoursAgo.toISOString().split('T')[0],
        time: twoHoursAgo.toTimeString().split(' ')[0],
        timestamp: twoHoursAgo.toISOString(),
        site: testEquipment.site,
        status: 'in-use',
        notes: 'Test usage for preventive maintenance'
      };

      const stopLog = {
        id: `test-log-${Date.now() + 1}`,
        equipmentId: testEquipment.id,
        equipmentName: testEquipment.name,
        equipmentType: testEquipment.type,
        action: 'stop-use' as const,
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().split(' ')[0],
        timestamp: now.toISOString(),
        site: testEquipment.site,
        status: 'available',
        notes: 'Test usage completed'
      };

      await OfflineDataManager.createEquipmentLog(startLog);
      await OfflineDataManager.createEquipmentLog(stopLog);
      
      addTestResult(`✅ Created test usage log for "${testEquipment.name}" (2 hours usage)`);
      await loadData(); // Refresh data
      
    } catch (error) {
      console.error('Error creating test log:', error);
      addTestResult('❌ Error creating test log: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Zap className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-blue-900">Preventive Maintenance System Test</h2>
        </div>
        <p className="text-blue-800 mb-4">
          This test panel helps verify that the preventive maintenance system is working correctly.
          Use it to test equipment usage calculation, schedule generation, and automatic triggers.
        </p>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={startAutoCheck}
          disabled={isAutoChecking || isLoading}
          className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          <Play className="w-4 h-4" />
          <span>Start Auto Check</span>
        </button>

        <button
          onClick={stopAutoCheck}
          disabled={!isAutoChecking || isLoading}
          className="flex items-center justify-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          <Square className="w-4 h-4" />
          <span>Stop Auto Check</span>
        </button>

        <button
          onClick={triggerManualCheck}
          disabled={isLoading}
          className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Manual Check</span>
        </button>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="flex items-center justify-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
        >
          <Database className="w-4 h-4" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Test Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={testEquipmentUsageCalculation}
          disabled={isLoading}
          className="flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          <Clock className="w-4 h-4" />
          <span>Test Usage Calculation</span>
        </button>

        <button
          onClick={createTestEquipmentLog}
          disabled={isLoading}
          className="flex items-center justify-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50"
        >
          <Wrench className="w-4 h-4" />
          <span>Create Test Log</span>
        </button>
      </div>

      {/* Status Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold">Equipment Usage</h3>
          </div>
          <p className="text-2xl font-bold text-blue-600">{equipmentUsage.length}</p>
          <p className="text-sm text-gray-600">Equipment with usage data</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold">Maintenance Schedules</h3>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{maintenanceSchedules.length}</p>
          <p className="text-sm text-gray-600">Active schedules</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            {isAutoChecking ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <Square className="w-5 h-5 text-red-600" />
            )}
            <h3 className="font-semibold">Auto Check Status</h3>
          </div>
          <p className={`text-2xl font-bold ${isAutoChecking ? 'text-green-600' : 'text-red-600'}`}>
            {isAutoChecking ? 'Active' : 'Inactive'}
          </p>
          <p className="text-sm text-gray-600">Automatic monitoring</p>
        </div>
      </div>

      {/* Test Results */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Test Results</h3>
          <button
            onClick={clearTestResults}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto">
          {testResults.length === 0 ? (
            <p className="text-gray-500 text-center">No test results yet. Run some tests to see results here.</p>
          ) : (
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono">
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Equipment Usage Details */}
      {equipmentUsage.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold mb-4">Equipment Usage Details</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Equipment</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Usage Hours</th>
                  <th className="px-4 py-2 text-left">Next Class</th>
                  <th className="px-4 py-2 text-left">Hours Until</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {equipmentUsage.map((usage, index) => (
                  <tr key={index} className="border-b">
                    <td className="px-4 py-2">{usage.equipment_name}</td>
                    <td className="px-4 py-2">{usage.equipment_type}</td>
                    <td className="px-4 py-2">{usage.total_usage_hours.toFixed(1)}h</td>
                    <td className="px-4 py-2">Class {usage.next_maintenance_class}</td>
                    <td className="px-4 py-2">{usage.hours_until_next_maintenance.toFixed(1)}h</td>
                    <td className="px-4 py-2">
                      {usage.is_overdue ? (
                        <span className="text-red-600 font-semibold">Overdue</span>
                      ) : usage.hours_until_next_maintenance < 10 ? (
                        <span className="text-yellow-600 font-semibold">Due Soon</span>
                      ) : (
                        <span className="text-green-600">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      )}
    </div>
  );
};

export default PreventiveMaintenanceTest; 