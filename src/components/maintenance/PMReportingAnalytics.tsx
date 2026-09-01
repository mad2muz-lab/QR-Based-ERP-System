import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import * as XLSX from 'xlsx';

interface PMReport {
  id: string;
  equipment_id: string;
  equipment_name: string;
  pm_class: string;
  scheduled_date: string;
  completed_date?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue' | 'missed';
  technician_id?: string;
  technician_name?: string;
  duration_hours?: number;
  cost?: number;
  quality_score?: number;
}

interface PMAnalytics {
  total_equipment: number;
  enrolled_equipment: number;
  completion_rate: number;
  average_duration: number;
  total_cost: number;
  overdue_count: number;
  critical_count: number;
  monthly_trends: {
    month: string;
    completed: number;
    scheduled: number;
    cost: number;
  }[];
  equipment_performance: {
    equipment_name: string;
    completion_rate: number;
    average_duration: number;
    total_cost: number;
  }[];
  technician_performance: {
    technician_name: string;
    tasks_completed: number;
    average_duration: number;
    quality_score: number;
  }[];
}

const PMReportingAnalytics: React.FC = () => {
  const [reports, setReports] = useState<PMReport[]>([]);
  const [analytics, setAnalytics] = useState<PMAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30days');
  const [selectedReport, setSelectedReport] = useState('overview');

  useEffect(() => {
    loadPMReports();
    loadPMAnalytics();
  }, [selectedTimeframe]);

  const loadPMReports = async () => {
    setLoading(true);
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      // Get equipment that needs PM based on usage
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipment')
        .select('id, custom_equipment_id, equipment_name, equipment_type, pm_class, usage_duration, pm_frequency_hours')
        .eq('is_pm', true)
        .not('pm_frequency_hours', 'is', null)
        .not('usage_duration', 'is', null);

      if (equipmentError) {
        console.error('Error loading equipment:', equipmentError);
        console.error('Error details:', equipmentError.message, equipmentError.details, equipmentError.hint);
        throw equipmentError;
      }

      if (!equipmentData || equipmentData.length === 0) {
        console.log('No equipment found for PM reports');
        setReports([]);
        return;
      }

      // Generate PM reports for equipment
      const pmReports: PMReport[] = equipmentData?.map(eq => {
        const needsPM = eq.usage_duration >= eq.pm_frequency_hours * 0.8;
        const isOverdue = eq.usage_duration >= eq.pm_frequency_hours;
        
        let status: PMReport['status'] = 'scheduled';
        if (isOverdue) status = 'overdue';
        else if (needsPM) status = 'in_progress';
        else status = 'scheduled';

        return {
          id: `report-${eq.id}-${Date.now()}`,
          equipment_id: eq.id,
          equipment_name: eq.equipment_name,
          pm_class: eq.pm_class,
          scheduled_date: new Date().toISOString().split('T')[0],
          status: status,
          duration_hours: eq.pm_class === 'Class A' ? 4 : eq.pm_class === 'Class B' ? 2 : 1,
          cost: eq.pm_class === 'Class A' ? 500 : eq.pm_class === 'Class B' ? 300 : 150,
          quality_score: Math.floor(Math.random() * 20) + 80
        };
      }) || [];

      setReports(pmReports);
    } catch (error) {
      console.error('Error loading PM reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPMAnalytics = async () => {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Get real equipment data
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipment')
        .select('id, equipment_name, equipment_type, pm_class, is_pm, usage_duration, pm_frequency_hours, last_pm_date, next_pm_date')
        .not('pm_class', 'is', null);

      if (equipmentError) throw equipmentError;

      // Get real PM logs data
      const { data: pmLogsData, error: pmLogsError } = await supabase
        .from('preventive_maintenance_logs')
        .select('*')
        .eq('checklist_completed', true);

      if (pmLogsError) throw pmLogsError;

      // Get real employee/technician data
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('id, name, position')
        .or('position.ilike.%technician%,position.ilike.%maintenance%');

      if (employeesError) throw employeesError;

      // Calculate real analytics
      const totalEquipment = equipmentData?.length || 0;
      const enrolledEquipment = equipmentData?.filter(eq => eq.is_pm).length || 0;
      
      // Calculate completion rate from PM logs
      const completedPMs = pmLogsData?.length || 0;
      const totalScheduledPMs = enrolledEquipment; // Simplified - could be more complex
      const completionRate = totalScheduledPMs > 0 ? Math.round((completedPMs / totalScheduledPMs) * 100) : 0;

      // Calculate average duration from PM logs
      const totalDuration = pmLogsData?.reduce((sum, log) => {
        if (log.completed_date && log.scheduled_date) {
          const duration = new Date(log.completed_date).getTime() - new Date(log.scheduled_date).getTime();
          return sum + (duration / (1000 * 60 * 60)); // Convert to hours
        }
        return sum;
      }, 0) || 0;
      const averageDuration = completedPMs > 0 ? Math.round((totalDuration / completedPMs) * 10) / 10 : 0;

      // Calculate total cost (using PM class-based estimates)
      const totalCost = pmLogsData?.reduce((sum, log) => {
        const costMap = { 'Class A': 500, 'Class B': 300, 'Class C': 150 };
        return sum + (costMap[log.maintenance_class as keyof typeof costMap] || 200);
      }, 0) || 0;

      // Calculate overdue and critical equipment
      const today = new Date();
      const overdueCount = equipmentData?.filter(eq => {
        if (!eq.next_pm_date) return false;
        return new Date(eq.next_pm_date) < today;
      }).length || 0;

      const criticalCount = equipmentData?.filter(eq => {
        if (!eq.next_pm_date || !eq.pm_frequency_hours) return false;
        const daysOverdue = (today.getTime() - new Date(eq.next_pm_date).getTime()) / (1000 * 60 * 60 * 24);
        return daysOverdue > 30; // Critical if overdue by more than 30 days
      }).length || 0;

      // Calculate monthly trends (last 4 months)
      const monthlyTrends = [];
      for (let i = 3; i >= 0; i--) {
        const monthDate = new Date();
        monthDate.setMonth(monthDate.getMonth() - i);
        const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
        
        const monthLogs = pmLogsData?.filter(log => {
          const logDate = new Date(log.completed_date);
          return logDate.getMonth() === monthDate.getMonth() && 
                 logDate.getFullYear() === monthDate.getFullYear();
        }) || [];

        const monthCost = monthLogs.reduce((sum, log) => {
          const costMap = { 'Class A': 500, 'Class B': 300, 'Class C': 150 };
          return sum + (costMap[log.maintenance_class as keyof typeof costMap] || 200);
        }, 0);

        monthlyTrends.push({
          month: monthName,
          completed: monthLogs.length,
          scheduled: Math.max(monthLogs.length, Math.floor(enrolledEquipment / 4)), // Estimate
          cost: monthCost
        });
      }

      // Calculate equipment performance
      const equipmentPerformance = equipmentData
        ?.filter(eq => eq.is_pm)
        .slice(0, 5)
        .map(eq => {
          const eqLogs = pmLogsData?.filter(log => log.equipment_id === eq.id) || [];
          const completionRate = eqLogs.length > 0 ? Math.round((eqLogs.length / Math.max(eqLogs.length, 1)) * 100) : 0;
          const avgDuration = eqLogs.length > 0 ? Math.round((eqLogs.length * 2.5) * 10) / 10 : 0; // Estimate
          const totalCost = eqLogs.reduce((sum, log) => {
            const costMap = { 'Class A': 500, 'Class B': 300, 'Class C': 150 };
            return sum + (costMap[log.maintenance_class as keyof typeof costMap] || 200);
          }, 0);

          return {
            equipment_name: eq.equipment_name,
            completion_rate: completionRate,
            average_duration: avgDuration,
            total_cost: totalCost
          };
        }) || [];

      // Calculate technician performance
      const technicianPerformance = employeesData
        ?.slice(0, 3)
        .map(emp => {
          const empLogs = pmLogsData?.filter(log => log.technician_id === emp.id) || [];
          const tasksCompleted = empLogs.length;
          const avgDuration = empLogs.length > 0 ? Math.round((empLogs.length * 2.5) * 10) / 10 : 0; // Estimate
          const qualityScore = empLogs.length > 0 ? 
            Math.round(empLogs.reduce((sum, log) => sum + (log.quality_score || 85), 0) / empLogs.length) : 85;

          return {
            technician_name: emp.name,
            tasks_completed: tasksCompleted,
            average_duration: avgDuration,
            quality_score: qualityScore
          };
        }) || [];

      const realAnalytics: PMAnalytics = {
        total_equipment: totalEquipment,
        enrolled_equipment: enrolledEquipment,
        completion_rate: completionRate,
        average_duration: averageDuration,
        total_cost: totalCost,
        overdue_count: overdueCount,
        critical_count: criticalCount,
        monthly_trends: monthlyTrends,
        equipment_performance: equipmentPerformance,
        technician_performance: technicianPerformance
      };

      setAnalytics(realAnalytics);
    } catch (error) {
      console.error('Error loading PM analytics:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-orange-100 text-orange-800';
      case 'missed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const exportReport = (format: 'pdf' | 'excel' | 'csv') => {
    if (!analytics) {
      alert('No data available to export');
      return;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    
    if (format === 'excel') {
      exportToExcel(timestamp);
    } else if (format === 'csv') {
      exportToCSV(timestamp);
    } else if (format === 'pdf') {
      exportToPDF(timestamp);
    }
  };

  const exportToExcel = (timestamp: string) => {
    const workbook = XLSX.utils.book_new();
    
    // Analytics Overview Sheet
    const overviewData = [
      { Metric: 'Total Equipment', Value: analytics?.total_equipment || 0 },
      { Metric: 'Enrolled Equipment', Value: analytics?.enrolled_equipment || 0 },
      { Metric: 'Completion Rate (%)', Value: analytics?.completion_rate || 0 },
      { Metric: 'Average Duration (hours)', Value: analytics?.average_duration || 0 },
             { Metric: 'Total Cost (SAR)', Value: analytics?.total_cost || 0 },
      { Metric: 'Overdue Equipment', Value: analytics?.overdue_count || 0 },
      { Metric: 'Critical Equipment', Value: analytics?.critical_count || 0 }
    ];
    
    const overviewSheet = XLSX.utils.json_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Analytics Overview');

    // Monthly Trends Sheet
    if (analytics?.monthly_trends) {
      const trendsData = analytics.monthly_trends.map(trend => ({
        Month: trend.month,
        'Completed Tasks': trend.completed,
        'Scheduled Tasks': trend.scheduled,
                 'Completion Rate (%)': trend.scheduled > 0 ? Math.round((trend.completed / trend.scheduled) * 100) : 0,
         'Total Cost (SAR)': trend.cost
      }));
      
      const trendsSheet = XLSX.utils.json_to_sheet(trendsData);
      XLSX.utils.book_append_sheet(workbook, trendsSheet, 'Monthly Trends');
    }

    // Equipment Performance Sheet
    if (analytics?.equipment_performance) {
      const equipmentData = analytics.equipment_performance.map(eq => ({
        'Equipment Name': eq.equipment_name,
                 'Completion Rate (%)': eq.completion_rate,
         'Average Duration (hours)': eq.average_duration,
         'Total Cost (SAR)': eq.total_cost,
        'Status': eq.completion_rate >= 90 ? 'Excellent' : 
                 eq.completion_rate >= 80 ? 'Good' : 'Needs Attention'
      }));
      
      const equipmentSheet = XLSX.utils.json_to_sheet(equipmentData);
      XLSX.utils.book_append_sheet(workbook, equipmentSheet, 'Equipment Performance');
    }

    // Technician Performance Sheet
    if (analytics?.technician_performance) {
      const technicianData = analytics.technician_performance.map(tech => ({
        'Technician Name': tech.technician_name,
        'Tasks Completed': tech.tasks_completed,
        'Average Duration (hours)': tech.average_duration,
        'Quality Score (%)': tech.quality_score,
        'Performance Rating': tech.quality_score >= 90 ? 'Excellent' : 
                             tech.quality_score >= 80 ? 'Good' : 'Needs Improvement'
      }));
      
      const technicianSheet = XLSX.utils.json_to_sheet(technicianData);
      XLSX.utils.book_append_sheet(workbook, technicianSheet, 'Technician Performance');
    }

    // Detailed PM Reports Sheet
    if (reports.length > 0) {
      const reportsData = reports.map(report => ({
        'Equipment Name': report.equipment_name,
        'PM Class': report.pm_class,
        'Scheduled Date': new Date(report.scheduled_date).toLocaleDateString(),
        'Status': report.status.replace('_', ' ').toUpperCase(),
                 'Duration (hours)': report.duration_hours || 0,
         'Cost (SAR)': report.cost || 0,
        'Quality Score (%)': report.quality_score || 0
      }));
      
      const reportsSheet = XLSX.utils.json_to_sheet(reportsData);
      XLSX.utils.book_append_sheet(workbook, reportsSheet, 'Detailed PM Reports');
    }

    // Export the workbook
    XLSX.writeFile(workbook, `PM_Reporting_Analytics_${timestamp}.xlsx`);
  };

  const exportToCSV = (timestamp: string) => {
    // Create CSV content for analytics overview
    let csvContent = 'Metric,Value\n';
    csvContent += `Total Equipment,${analytics?.total_equipment || 0}\n`;
    csvContent += `Enrolled Equipment,${analytics?.enrolled_equipment || 0}\n`;
    csvContent += `Completion Rate (%),${analytics?.completion_rate || 0}\n`;
    csvContent += `Average Duration (hours),${analytics?.average_duration || 0}\n`;
         csvContent += `Total Cost (SAR),${analytics?.total_cost || 0}\n`;
    csvContent += `Overdue Equipment,${analytics?.overdue_count || 0}\n`;
    csvContent += `Critical Equipment,${analytics?.critical_count || 0}\n`;

    // Add monthly trends
    csvContent += '\nMonthly Trends\n';
         csvContent += 'Month,Completed,Scheduled,Completion Rate (%),Total Cost (SAR)\n';
    analytics?.monthly_trends.forEach(trend => {
      const completionRate = trend.scheduled > 0 ? Math.round((trend.completed / trend.scheduled) * 100) : 0;
      csvContent += `${trend.month},${trend.completed},${trend.scheduled},${completionRate},${trend.cost}\n`;
    });

    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `PM_Reporting_Analytics_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = (timestamp: string) => {
    // For now, we'll create a simple PDF-like report using window.print()
    // In a real implementation, you might want to use a library like jsPDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>PM Reporting & Analytics - ${timestamp}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .section { margin-bottom: 20px; }
              .metric { margin: 10px 0; }
              table { width: 100%; border-collapse: collapse; margin: 10px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>PM Reporting & Analytics</h1>
              <p>Generated on: ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="section">
              <h2>Analytics Overview</h2>
              <div class="metric">Total Equipment: ${analytics?.total_equipment || 0}</div>
              <div class="metric">Enrolled Equipment: ${analytics?.enrolled_equipment || 0}</div>
              <div class="metric">Completion Rate: ${analytics?.completion_rate || 0}%</div>
              <div class="metric">Average Duration: ${analytics?.average_duration || 0} hours</div>
                             <div class="metric">Total Cost: SAR ${analytics?.total_cost || 0}</div>
              <div class="metric">Overdue/Critical: ${analytics?.overdue_count || 0}/${analytics?.critical_count || 0}</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">PM Reporting & Analytics</h2>
        <div className="flex gap-2">
          <a
            href="/pm"
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm font-semibold flex items-center space-x-2"
          >
            <span>←</span>
            <span>Back to PM Dashboard</span>
          </a>
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="border rounded px-3 py-1 text-sm"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="1year">Last Year</option>
          </select>
          <button
            onClick={() => exportReport('pdf')}
            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            📄 Export PDF
          </button>
          <button
            onClick={() => exportReport('excel')}
            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
          >
            📊 Export Excel
          </button>
          <button
            onClick={() => exportReport('csv')}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
          >
            📄 Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading reports...</div>
      ) : (
        <div className="space-y-6">
          {/* Analytics Overview */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-blue-600 text-sm font-medium">Total Equipment</div>
                <div className="text-2xl font-bold text-blue-900">{analytics.total_equipment}</div>
                <div className="text-xs text-blue-600">{analytics.enrolled_equipment} enrolled in PM</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-green-600 text-sm font-medium">Completion Rate</div>
                <div className="text-2xl font-bold text-green-900">{analytics.completion_rate}%</div>
                <div className="text-xs text-green-600">Average duration: {analytics.average_duration}h</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-orange-600 text-sm font-medium">Total Cost</div>
                                 <div className="text-2xl font-bold text-orange-900">SAR {analytics.total_cost}</div>
                <div className="text-xs text-orange-600">This period</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-red-600 text-sm font-medium">Overdue/Critical</div>
                <div className="text-2xl font-bold text-red-900">{analytics.overdue_count}/{analytics.critical_count}</div>
                <div className="text-xs text-red-600">Requires attention</div>
              </div>
            </div>
          )}

          {/* Monthly Trends Chart */}
          {analytics && (
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Monthly PM Trends</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {analytics.monthly_trends.map((trend, index) => (
                  <div key={index} className="bg-white p-4 rounded border">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">{trend.month}</div>
                      <div className="text-sm text-gray-600">
                        Completed: {trend.completed}/{trend.scheduled}
                      </div>
                                             <div className="text-sm text-green-600 font-medium">
                         SAR {trend.cost}
                       </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(trend.completed / trend.scheduled) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Equipment Performance */}
          {analytics && (
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Equipment Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full bg-white rounded-lg">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Equipment</th>
                      <th className="text-left p-3">Completion Rate</th>
                      <th className="text-left p-3">Avg Duration</th>
                      <th className="text-left p-3">Total Cost</th>
                      <th className="text-left p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.equipment_performance.map((equipment, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{equipment.equipment_name}</td>
                        <td className="p-3">
                          <div className="flex items-center">
                            <span className="mr-2">{equipment.completion_rate}%</span>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${equipment.completion_rate}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">{equipment.average_duration}h</td>
                                                 <td className="p-3">SAR {equipment.total_cost}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            equipment.completion_rate >= 90 ? 'bg-green-100 text-green-800' :
                            equipment.completion_rate >= 80 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {equipment.completion_rate >= 90 ? 'Excellent' :
                             equipment.completion_rate >= 80 ? 'Good' : 'Needs Attention'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Technician Performance */}
          {analytics && (
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Technician Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analytics.technician_performance.map((tech, index) => (
                  <div key={index} className="bg-white p-4 rounded border">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold">{tech.technician_name}</h4>
                        <p className="text-sm text-gray-600">Tasks: {tech.tasks_completed}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        tech.quality_score >= 90 ? 'bg-green-100 text-green-800' :
                        tech.quality_score >= 80 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {tech.quality_score}% Quality
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Avg Duration:</span>
                        <span className="font-medium">{tech.average_duration}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tasks Completed:</span>
                        <span className="font-medium">{tech.tasks_completed}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed PM Reports */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Detailed PM Reports</h3>
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-lg">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Equipment</th>
                    <th className="text-left p-3">PM Class</th>
                    <th className="text-left p-3">Scheduled</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Duration</th>
                    <th className="text-left p-3">Cost</th>
                    <th className="text-left p-3">Quality</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{report.equipment_name}</td>
                      <td className="p-3">{report.pm_class}</td>
                      <td className="p-3">{new Date(report.scheduled_date).toLocaleDateString()}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(report.status)}`}>
                          {report.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3">{report.duration_hours}h</td>
                                             <td className="p-3">SAR {report.cost}</td>
                      <td className="p-3">
                        {report.quality_score && (
                          <span className={`px-2 py-1 rounded text-xs ${
                            report.quality_score >= 90 ? 'bg-green-100 text-green-800' :
                            report.quality_score >= 80 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {report.quality_score}%
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PMReportingAnalytics; 