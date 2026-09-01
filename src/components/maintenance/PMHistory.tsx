import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { ChevronDown, ChevronRight, Calendar, User, CheckCircle, AlertTriangle, Clock, Award } from 'lucide-react';

interface PMHistoryRecord {
  id: string;
  equipment_id: string;
  equipment_name: string;
  equipment_type: string;
  maintenance_class: string;
  technician_id: string;
  technician_name: string;
  scheduled_date: string;
  completed_date: string;
  quality_score: number;
  checklist_completed: boolean;
  safety_checks_passed: boolean;
  total_items: number;
  completed_items: number;
  required_items_completed: number;
  created_at: string;
}

interface PMAnalytics {
  totalMaintenance: number;
  averageQualityScore: number;
  onTimeCompletions: number;
  overdueCompletions: number;
  safetyComplianceRate: number;
  topPerformingTechnicians: Array<{name: string, avgScore: number, count: number}>;
  equipmentPerformance: Array<{name: string, avgScore: number, count: number}>;
  monthlyTrends: Array<{month: string, count: number, avgScore: number}>;
  qualityDistribution: Array<{range: string, count: number}>;
}

interface HierarchicalData {
  [pmClass: string]: {
    [equipmentType: string]: {
      [equipmentName: string]: PMHistoryRecord[];
    };
  };
}

const PMHistory: React.FC = () => {
  const [history, setHistory] = useState<PMHistoryRecord[]>([]);
  const [hierarchicalData, setHierarchicalData] = useState<HierarchicalData>({});
  const [analytics, setAnalytics] = useState<PMAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState({
    equipment: '',
    technician: '',
    dateRange: '30', // days
    maintenanceClass: ''
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    loadPMHistory();
  }, [filter]);

  const loadPMHistory = async () => {
    setLoading(true);
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      let query = supabase
        .from('preventive_maintenance_logs')
        .select(`
          *,
          equipment:equipment_id(name, type),
          technician:technician_id(name)
        `)
        .eq('checklist_completed', true)
        .order('completed_date', { ascending: false });

      // Apply filters
      if (filter.equipment) {
        query = query.eq('equipment_id', filter.equipment);
      }
      if (filter.technician) {
        query = query.eq('technician_id', filter.technician);
      }
      if (filter.maintenanceClass) {
        query = query.eq('maintenance_class', filter.maintenanceClass);
      }
      if (filter.dateRange !== 'all') {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(filter.dateRange));
        query = query.gte('completed_date', daysAgo.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading PM history:', error);
        return;
      }

      const formattedData = data?.map(record => ({
        ...record,
        equipment_name: record.equipment?.equipment_name || 'Unknown Equipment',
        equipment_type: record.equipment?.equipment_type || 'Unknown Type',
        technician_name: record.technician?.name || 'Unknown Technician'
      })) || [];

      setHistory(formattedData);
      organizeHierarchicalData(formattedData);
      calculateAnalytics(formattedData);
    } catch (error) {
      console.error('Error loading PM history:', error);
    } finally {
      setLoading(false);
    }
  };

  const organizeHierarchicalData = (data: PMHistoryRecord[]) => {
    const hierarchical: HierarchicalData = {};

    data.forEach(record => {
      const pmClass = record.maintenance_class;
      const equipmentType = record.equipment_type;
      const equipmentName = record.equipment_name;

      if (!hierarchical[pmClass]) {
        hierarchical[pmClass] = {};
      }
      if (!hierarchical[pmClass][equipmentType]) {
        hierarchical[pmClass][equipmentType] = {};
      }
      if (!hierarchical[pmClass][equipmentType][equipmentName]) {
        hierarchical[pmClass][equipmentType][equipmentName] = [];
      }

      hierarchical[pmClass][equipmentType][equipmentName].push(record);
    });

    setHierarchicalData(hierarchical);
  };

  const calculateAnalytics = (data: PMHistoryRecord[]) => {
    if (data.length === 0) {
      setAnalytics(null);
      return;
    }

    const totalMaintenance = data.length;
    const averageQualityScore = data.reduce((sum, record) => sum + (record.quality_score || 0), 0) / totalMaintenance;
    const onTimeCompletions = data.filter(record => {
      const completed = new Date(record.completed_date);
      const scheduled = new Date(record.scheduled_date);
      return completed <= scheduled;
    }).length;
    const overdueCompletions = totalMaintenance - onTimeCompletions;
    const safetyComplianceRate = (data.filter(record => record.safety_checks_passed).length / totalMaintenance) * 100;

    // Top performing technicians
    const technicianStats = data.reduce((acc, record) => {
      const techName = record.technician_name;
      if (!acc[techName]) {
        acc[techName] = { total: 0, count: 0 };
      }
      acc[techName].total += record.quality_score || 0;
      acc[techName].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const topPerformingTechnicians = Object.entries(technicianStats)
      .map(([name, stats]) => ({
        name,
        avgScore: stats.total / stats.count,
        count: stats.count
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 5);

    // Equipment performance
    const equipmentStats = data.reduce((acc, record) => {
      const equipName = record.equipment_name;
      if (!acc[equipName]) {
        acc[equipName] = { total: 0, count: 0 };
      }
      acc[equipName].total += record.quality_score || 0;
      acc[equipName].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const equipmentPerformance = Object.entries(equipmentStats)
      .map(([name, stats]) => ({
        name,
        avgScore: stats.total / stats.count,
        count: stats.count
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 5);

    // Monthly trends
    const monthlyStats = data.reduce((acc, record) => {
      const month = new Date(record.completed_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      if (!acc[month]) {
        acc[month] = { total: 0, count: 0 };
      }
      acc[month].total += record.quality_score || 0;
      acc[month].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const monthlyTrends = Object.entries(monthlyStats)
      .map(([month, stats]) => ({
        month,
        count: stats.count,
        avgScore: stats.total / stats.count
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    // Quality distribution
    const qualityRanges = [
      { range: '90-100%', min: 90, max: 100 },
      { range: '80-89%', min: 80, max: 89 },
      { range: '70-79%', min: 70, max: 79 },
      { range: '60-69%', min: 60, max: 69 },
      { range: 'Below 60%', min: 0, max: 59 }
    ];

    const qualityDistribution = qualityRanges.map(range => ({
      range: range.range,
      count: data.filter(record => {
        const score = record.quality_score || 0;
        return score >= range.min && score <= range.max;
      }).length
    }));

    setAnalytics({
      totalMaintenance,
      averageQualityScore,
      onTimeCompletions,
      overdueCompletions,
      safetyComplianceRate,
      topPerformingTechnicians,
      equipmentPerformance,
      monthlyTrends,
      qualityDistribution
    });
  };

  const toggleSection = (sectionKey: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionKey)) {
      newExpanded.delete(sectionKey);
    } else {
      newExpanded.add(sectionKey);
    }
    setExpandedSections(newExpanded);
  };

  const getStatusColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 80) return 'bg-blue-100 text-blue-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getPMClassColor = (pmClass: string) => {
    switch (pmClass) {
      case 'Class A': return 'bg-blue-100 text-blue-800';
      case 'Class B': return 'bg-green-100 text-green-800';
      case 'Class C': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSafetyStatusIcon = (passed: boolean) => {
    return passed ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-red-600" />
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Award className="h-8 w-8 text-blue-600" />
            PM History & Analytics
          </h1>
          <p className="text-gray-600 mt-2">
            Hierarchical view of preventive maintenance history and performance analytics
          </p>
        </div>
        
        <a
          href="/pm/dashboard"
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
        >
          ← Back to PM Dashboard
        </a>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              value={filter.dateRange}
              onChange={(e) => setFilter({ ...filter, dateRange: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
              <option value="all">All time</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Class</label>
            <select
              value={filter.maintenanceClass}
              onChange={(e) => setFilter({ ...filter, maintenanceClass: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Classes</option>
              <option value="Class A">Class A</option>
              <option value="Class B">Class B</option>
              <option value="Class C">Class C</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading PM history...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Analytics Summary */}
          {analytics && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Performance Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{analytics.totalMaintenance}</div>
                  <div className="text-sm text-gray-600">Total Maintenance</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{analytics.averageQualityScore.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Avg Quality Score</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{analytics.onTimeCompletions}</div>
                  <div className="text-sm text-gray-600">On-Time Completions</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{analytics.safetyComplianceRate.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Safety Compliance</div>
                </div>
              </div>
            </div>
          )}

          {/* Hierarchical History View */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Maintenance History by Class & Equipment</h3>
            </div>
            
            <div className="p-6">
              {Object.keys(hierarchicalData).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">No maintenance history found</p>
                  <p className="text-sm">Complete some PM tasks to see history here</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(hierarchicalData).map(([pmClass, equipmentTypes]) => (
                    <div key={pmClass} className="border border-gray-200 rounded-lg">
                      {/* PM Class Header */}
                      <div 
                        className="px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                        onClick={() => toggleSection(`class-${pmClass}`)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {expandedSections.has(`class-${pmClass}`) ? (
                              <ChevronDown className="h-5 w-5 text-gray-600" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-gray-600" />
                            )}
                            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPMClassColor(pmClass)}`}>
                              {pmClass}
                            </span>
                            <span className="text-sm text-gray-600">
                              {Object.values(equipmentTypes).reduce((total, types) => 
                                total + Object.values(types).reduce((sum, records) => sum + records.length, 0), 0
                              )} maintenance records
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Equipment Types */}
                      {expandedSections.has(`class-${pmClass}`) && (
                        <div className="p-4 space-y-4">
                          {Object.entries(equipmentTypes).map(([equipmentType, equipments]) => (
                            <div key={equipmentType} className="border border-gray-200 rounded-lg">
                              {/* Equipment Type Header */}
                              <div 
                                className="px-4 py-2 bg-blue-50 border-b border-gray-200 cursor-pointer hover:bg-blue-100"
                                onClick={() => toggleSection(`type-${pmClass}-${equipmentType}`)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    {expandedSections.has(`type-${pmClass}-${equipmentType}`) ? (
                                      <ChevronDown className="h-4 w-4 text-gray-600" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-gray-600" />
                                    )}
                                    <span className="font-medium text-gray-900">{equipmentType}</span>
                                    <span className="text-sm text-gray-600">
                                      {Object.values(equipments).reduce((sum, records) => sum + records.length, 0)} records
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Individual Equipment */}
                              {expandedSections.has(`type-${pmClass}-${equipmentType}`) && (
                                <div className="p-4 space-y-4">
                                  {Object.entries(equipments).map(([equipmentName, records]) => (
                                    <div key={equipmentName} className="border border-gray-200 rounded-lg">
                                      {/* Equipment Header */}
                                      <div 
                                        className="px-4 py-2 bg-green-50 border-b border-gray-200 cursor-pointer hover:bg-green-100"
                                        onClick={() => toggleSection(`equipment-${pmClass}-${equipmentType}-${equipmentName}`)}
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-3">
                                            {expandedSections.has(`equipment-${pmClass}-${equipmentType}-${equipmentName}`) ? (
                                              <ChevronDown className="h-4 w-4 text-gray-600" />
                                            ) : (
                                              <ChevronRight className="h-4 w-4 text-gray-600" />
                                            )}
                                            <span className="font-medium text-gray-900">{equipmentName}</span>
                                            <span className="text-sm text-gray-600">{records.length} maintenance records</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-600">
                                              Avg Score: {Math.round(records.reduce((sum, r) => sum + (r.quality_score || 0), 0) / records.length)}%
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Maintenance Records */}
                                      {expandedSections.has(`equipment-${pmClass}-${equipmentType}-${equipmentName}`) && (
                                        <div className="p-4">
                                          <div className="space-y-3">
                                            {records.map((record) => (
                                              <div key={record.id} className="bg-gray-50 p-4 rounded-lg">
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                  <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-gray-500" />
                                                    <div>
                                                      <div className="text-sm font-medium text-gray-900">
                                                        {new Date(record.completed_date).toLocaleDateString()}
                                                      </div>
                                                      <div className="text-xs text-gray-500">Completed</div>
                                                    </div>
                                                  </div>
                                                  
                                                  <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-gray-500" />
                                                    <div>
                                                      <div className="text-sm font-medium text-gray-900">
                                                        {record.technician_name}
                                                      </div>
                                                      <div className="text-xs text-gray-500">Technician</div>
                                                    </div>
                                                  </div>
                                                  
                                                  <div className="flex items-center gap-2">
                                                    <Award className="h-4 w-4 text-gray-500" />
                                                    <div>
                                                      <div className={`text-sm font-medium ${getStatusColor(record.quality_score || 0)}`}>
                                                        {record.quality_score || 0}%
                                                      </div>
                                                      <div className="text-xs text-gray-500">Quality Score</div>
                                                    </div>
                                                  </div>
                                                  
                                                  <div className="flex items-center gap-2">
                                                    {getSafetyStatusIcon(record.safety_checks_passed)}
                                                    <div>
                                                      <div className="text-sm font-medium text-gray-900">
                                                        {record.safety_checks_passed ? 'Passed' : 'Failed'}
                                                      </div>
                                                      <div className="text-xs text-gray-500">Safety Check</div>
                                                    </div>
                                                  </div>
                                                </div>
                                                
                                                <div className="mt-3 pt-3 border-t border-gray-200">
                                                  <div className="grid grid-cols-3 gap-4 text-xs text-gray-600">
                                                    <div>Items: {record.completed_items}/{record.total_items}</div>
                                                    <div>Required: {record.required_items_completed}</div>
                                                    <div>Scheduled: {new Date(record.scheduled_date).toLocaleDateString()}</div>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PMHistory; 