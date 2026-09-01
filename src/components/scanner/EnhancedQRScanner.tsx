import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { 
  QrCode, 
  Wrench, 
  Calendar, 
  Play, 
  Square, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Clock,
  Settings,
  FileText,
  RefreshCw
} from 'lucide-react';
import PMClassSelection from '../maintenance/PMClassSelection';
import PMChecklist from '../maintenance/PMChecklist';
import '../../styles/qr-workflow.css';

interface Action {
  id: string;
  label: string;
  icon: string;
  color: string;
  description?: string;
}

interface PMConfig {
  equipment_type: string;
  'Class A - Hours Interval': number;
  'Class B - Hours Interval': number;
  'Class C - Hours Interval': number;
  'Class A - Threshold Hours': number;
  'Class B - Threshold Hours': number;
  'Class C - Threshold Hours': number;
  'Days Interval': number;
  'Hours Interval': number;
  'KM Interval': number;
  description: string;
  is_active: boolean;
}

interface Equipment {
  id: string;
  name: string;
  type: string;
  site: string;
  status: string;
  operational_status: string;
  last_updated: string;
}

interface PMStatus {
  lastPMDate: Date | null;
  nextPMDate: Date | null;
  isPMDue: boolean;
  pmClass: string | null;
  currentHours: number;
}

const EnhancedQRScanner: React.FC = () => {
  console.log('🔍 EnhancedQRScanner component is loading...');
  
  const [scannedEquipment, setScannedEquipment] = useState<Equipment | null>(null);
  const [pmConfig, setPmConfig] = useState<PMConfig | null>(null);
  const [pmStatus, setPmStatus] = useState<PMStatus | null>(null);
  const [availableActions, setAvailableActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'scanning' | 'equipment-info' | 'action-selection' | 'pm-class-selection' | 'pm-checklist'>('scanning');
  const [selectedPMClass, setSelectedPMClass] = useState<string | null>(null);

  // PM Configuration data from your database
  const pmConfigurations: PMConfig[] = [
    {
      "equipment_type": "Asphalt Paver",
      "Class A - Hours Interval": 40,
      "Class B - Hours Interval": 480,
      "Class C - Hours Interval": 1920,
      "Class A - Threshold Hours": 32,
      "Class B - Threshold Hours": 384,
      "Class C - Threshold Hours": 1536,
      "Days Interval": 7,
      "Hours Interval": 50,
      "KM Interval": 1000,
      "description": "Asphalt paver maintenance schedule",
      "is_active": true
    },
    {
      "equipment_type": "Backhoe Loader",
      "Class A - Hours Interval": 40,
      "Class B - Hours Interval": 480,
      "Class C - Hours Interval": 1920,
      "Class A - Threshold Hours": 32,
      "Class B - Threshold Hours": 384,
      "Class C - Threshold Hours": 1536,
      "Days Interval": 7,
      "Hours Interval": 50,
      "KM Interval": 1000,
      "description": "Versatile equipment for digging and loading operations",
      "is_active": true
    },
    {
      "equipment_type": "Batch Plants",
      "Class A - Hours Interval": 40,
      "Class B - Hours Interval": 480,
      "Class C - Hours Interval": 1920,
      "Class A - Threshold Hours": 32,
      "Class B - Threshold Hours": 384,
      "Class C - Threshold Hours": 1536,
      "Days Interval": 7,
      "Hours Interval": 50,
      "KM Interval": 1000,
      "description": "Concrete batch plant maintenance schedule",
      "is_active": true
    },
    {
      "equipment_type": "Bitumen Sprayer",
      "Class A - Hours Interval": 40,
      "Class B - Hours Interval": 480,
      "Class C - Hours Interval": 1920,
      "Class A - Threshold Hours": 32,
      "Class B - Threshold Hours": 384,
      "Class C - Threshold Hours": 1536,
      "Days Interval": 7,
      "Hours Interval": 50,
      "KM Interval": 1000,
      "description": "Bitumen sprayer maintenance schedule",
      "is_active": true
    },
    {
      "equipment_type": "Bulldozer",
      "Class A - Hours Interval": 40,
      "Class B - Hours Interval": 480,
      "Class C - Hours Interval": 1920,
      "Class A - Threshold Hours": 32,
      "Class B - Threshold Hours": 384,
      "Class C - Threshold Hours": 1536,
      "Days Interval": 7,
      "Hours Interval": 50,
      "KM Interval": 1000,
      "description": "Bulldozer maintenance schedule",
      "is_active": true
    },
    {
      "equipment_type": "Excavator",
      "Class A - Hours Interval": 40,
      "Class B - Hours Interval": 480,
      "Class C - Hours Interval": 1920,
      "Class A - Threshold Hours": 32,
      "Class B - Threshold Hours": 384,
      "Class C - Threshold Hours": 1536,
      "Days Interval": 7,
      "Hours Interval": 50,
      "KM Interval": 1000,
      "description": "Excavator maintenance schedule",
      "is_active": true
    },
    {
      "equipment_type": "Excavators",
      "Class A - Hours Interval": 40,
      "Class B - Hours Interval": 480,
      "Class C - Hours Interval": 1920,
      "Class A - Threshold Hours": 32,
      "Class B - Threshold Hours": 384,
      "Class C - Threshold Hours": 1536,
      "Days Interval": 7,
      "Hours Interval": 50,
      "KM Interval": 1000,
      "description": "Excavator maintenance schedule",
      "is_active": true
    },
    {
      "equipment_type": "Fuel Tanker",
      "Class A - Hours Interval": 40,
      "Class B - Hours Interval": 480,
      "Class C - Hours Interval": 1920,
      "Class A - Threshold Hours": 32,
      "Class B - Threshold Hours": 384,
      "Class C - Threshold Hours": 1536,
      "Days Interval": 7,
      "Hours Interval": 50,
      "KM Interval": 1000,
      "description": "Fuel Tanker maintenance schedule",
      "is_active": true
    },
    {
      "equipment_type": "Heavy Equipment",
      "Class A - Hours Interval": 40,
      "Class B - Hours Interval": 480,
      "Class C - Hours Interval": 1920,
      "Class A - Threshold Hours": 32,
      "Class B - Threshold Hours": 384,
      "Class C - Threshold Hours": 1536,
      "Days Interval": 7,
      "Hours Interval": 50,
      "KM Interval": 1000,
      "description": "General heavy equipment maintenance schedule",
      "is_active": true
    },
    {
      "equipment_type": "Loaders",
      "Class A - Hours Interval": 40,
      "Class B - Hours Interval": 480,
      "Class C - Hours Interval": 1920,
      "Class A - Threshold Hours": 32,
      "Class B - Threshold Hours": 384,
      "Class C - Threshold Hours": 1536,
      "Days Interval": 7,
      "Hours Interval": 50,
      "KM Interval": 1000,
      "description": "Loader maintenance schedule",
      "is_active": true
    },
    {
      "equipment_type": "Mixer",
      "Class A - Hours Interval": 40,
      "Class B - Hours Interval": 480,
      "Class C - Hours Interval": 1920,
      "Class A - Threshold Hours": 32,
      "Class B - Threshold Hours": 384,
      "Class C - Threshold Hours": 1536,
      "Days Interval": 7,
      "Hours Interval": 50,
      "KM Interval": 1000,
      "description": "Concrete mixer maintenance schedule",
      "is_active": true
    },
    {
      "equipment_type": "Pavers",
      "Class A - Hours Interval": 40,
      "Class B - Hours Interval": 480,
      "Class C - Hours Interval": 1920,
      "Class A - Threshold Hours": 32,
      "Class B - Threshold Hours": 384,
      "Class C - Threshold Hours": 1536,
      "Days Interval": 7,
      "Hours Interval": 50,
      "KM Interval": 1000,
      "description": "Asphalt paver maintenance schedule",
      "is_active": true
    },
    {
      "equipment_type": "Road Roller",
      "Class A - Hours Interval": 40,
      "Class B - Hours Interval": 480,
      "Class C - Hours Interval": 1920,
      "Class A - Threshold Hours": 32,
      "Class B - Threshold Hours": 384,
      "Class C - Threshold Hours": 1536,
      "Days Interval": 7,
      "Hours Interval": 50,
      "KM Interval": 1000,
      "description": "Compaction equipment for road construction",
      "is_active": true
    },
    {
      "equipment_type": "Rollers",
      "Class A - Hours Interval": 40,
      "Class B - Hours Interval": 480,
      "Class C - Hours Interval": 1920,
      "Class A - Threshold Hours": 32,
      "Class B - Threshold Hours": 384,
      "Class C - Threshold Hours": 1536,
      "Days Interval": 7,
      "Hours Interval": 50,
      "KM Interval": 1000,
      "description": "Compaction roller maintenance schedule",
      "is_active": true
    },
    {
      "equipment_type": "Wheel Loader",
      "Class A - Hours Interval": 40,
      "Class B - Hours Interval": 480,
      "Class C - Hours Interval": 1920,
      "Class A - Threshold Hours": 32,
      "Class B - Threshold Hours": 384,
      "Class C - Threshold Hours": 1536,
      "Days Interval": 7,
      "Hours Interval": 50,
      "KM Interval": 1000,
      "description": "Material handling equipment for loading and transport",
      "is_active": true
    }
  ];

  const handleQRScan = async (qrData: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Parse QR data to get equipment ID
      const equipmentId = parseQRData(qrData);
      
      // Load equipment details from database
      const { data: equipment, error: equipmentError } = await supabase
        .from('equipment')
        .select('*')
        .eq('id', equipmentId)
        .single();

      if (equipmentError) {
        throw new Error('Equipment not found');
      }

      if (equipment) {
        setScannedEquipment(equipment);
        
        // Get PM configuration for this equipment type
        const config = pmConfigurations.find(
          cfg => cfg.equipment_type === equipment.type
        );
        setPmConfig(config || null);
        
        // Check current PM status
        const pmStatus = await checkPMStatus(equipmentId, config);
        setPmStatus(pmStatus);
        
        // Determine available actions
        const actions = determineAvailableActions(equipment, config, pmStatus);
        setAvailableActions(actions);
        
        setCurrentStep('equipment-info');
      }
    } catch (error) {
      console.error('Error processing QR scan:', error);
      setError('Failed to process QR code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const parseQRData = (qrData: string): string => {
    // Extract equipment ID from QR data
    // This might be the full QR data or a specific format
    return qrData;
  };

  const checkPMStatus = async (equipmentId: string, pmConfig: PMConfig | null): Promise<PMStatus> => {
    if (!pmConfig) {
      return {
        lastPMDate: null,
        nextPMDate: null,
        isPMDue: false,
        pmClass: null,
        currentHours: 0
      };
    }

    try {
      // Get latest PM logs for this equipment
      const { data: pmLogs } = await supabase
        .from('preventive_maintenance_logs')
        .select('*')
        .eq('equipment_id', equipmentId)
        .order('scheduled_date', { ascending: false })
        .limit(1);

      const now = new Date();
      let lastPMDate: Date | null = null;
      let nextPMDate: Date | null = null;
      let isPMDue = false;
      let pmClass: string | null = null;
      let currentHours = 0;

      if (pmLogs && pmLogs.length > 0) {
        const latestPM = pmLogs[0];
        lastPMDate = new Date(latestPM.performed_date || latestPM.scheduled_date);
        
        // Calculate next PM date based on the last PM class
        nextPMDate = calculateNextPMDate(latestPM, pmConfig);
        
        // Determine if PM is due
        isPMDue = isPMDue(latestPM, pmConfig);
        pmClass = determinePMClass(latestPM, pmConfig);
        
        // Estimate current hours (this would ideally come from equipment usage tracking)
        currentHours = estimateCurrentHours(lastPMDate, latestPM.maintenance_class, pmConfig);
      } else {
        // No previous PM, check if initial PM is due
        isPMDue = true;
        pmClass = 'A';
        currentHours = 0;
      }

      return {
        lastPMDate,
        nextPMDate,
        isPMDue,
        pmClass,
        currentHours
      };
    } catch (error) {
      console.error('Error checking PM status:', error);
      return {
        lastPMDate: null,
        nextPMDate: null,
        isPMDue: false,
        pmClass: null,
        currentHours: 0
      };
    }
  };

  const calculateNextPMDate = (latestPM: any, pmConfig: PMConfig): Date => {
    const lastDate = new Date(latestPM.performed_date || latestPM.scheduled_date);
    const daysToAdd = pmConfig['Days Interval'];
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    return nextDate;
  };

  const isPMDue = (latestPM: any, pmConfig: PMConfig): boolean => {
    const lastDate = new Date(latestPM.performed_date || latestPM.scheduled_date);
    const now = new Date();
    const daysSinceLastPM = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceLastPM >= pmConfig['Days Interval'];
  };

  const determinePMClass = (latestPM: any, pmConfig: PMConfig): string => {
    // This is a simplified logic - in practice, you'd check hours and other factors
    const lastDate = new Date(latestPM.performed_date || latestPM.scheduled_date);
    const now = new Date();
    const daysSinceLastPM = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLastPM >= 30) return 'C';
    if (daysSinceLastPM >= 7) return 'B';
    return 'A';
  };

  const estimateCurrentHours = (lastPMDate: Date, lastPMClass: string, pmConfig: PMConfig): number => {
    const now = new Date();
    const daysSinceLastPM = Math.floor((now.getTime() - lastPMDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Estimate 8 hours per day of operation
    const estimatedHours = daysSinceLastPM * 8;
    
    // Cap at the threshold for the last PM class
    const threshold = lastPMClass === 'A' ? pmConfig['Class A - Threshold Hours'] :
                     lastPMClass === 'B' ? pmConfig['Class B - Threshold Hours'] :
                     pmConfig['Class C - Threshold Hours'];
    
    return Math.min(estimatedHours, threshold);
  };

  const determineAvailableActions = (equipment: Equipment, pmConfig: PMConfig | null, pmStatus: PMStatus | null): Action[] => {
    const actions: Action[] = [];
    
    // Always available
    actions.push({ 
      id: 'view_details', 
      label: 'View Equipment Details', 
      icon: 'info',
      color: 'blue',
      description: 'View complete equipment information'
    });
    
    // PM-related actions
    if (pmStatus?.isPMDue && pmConfig) {
      actions.push({ 
        id: 'start_pm', 
        label: `Start ${pmStatus.pmClass} Maintenance`, 
        icon: 'wrench',
        color: 'orange',
        description: `Begin ${pmStatus.pmClass} preventive maintenance`
      });
      actions.push({ 
        id: 'view_pm_schedule', 
        label: 'View PM Schedule', 
        icon: 'calendar',
        color: 'purple',
        description: 'View maintenance schedule and history'
      });
    }
    
    // Equipment status actions
    if (equipment.status === 'available') {
      actions.push({ 
        id: 'start_using', 
        label: 'Start Using Equipment', 
        icon: 'play',
        color: 'green',
        description: 'Begin using this equipment'
      });
    } else if (equipment.status === 'in_use') {
      actions.push({ 
        id: 'stop_using', 
        label: 'Stop Using Equipment', 
        icon: 'square',
        color: 'red',
        description: 'Stop using this equipment'
      });
    } else if (equipment.status === 'maintenance') {
      actions.push({ 
        id: 'continue_maintenance', 
        label: 'Continue Maintenance', 
        icon: 'wrench',
        color: 'yellow',
        description: 'Continue ongoing maintenance work'
      });
      actions.push({ 
        id: 'complete_maintenance', 
        label: 'Complete Maintenance', 
        icon: 'check',
        color: 'green',
        description: 'Mark maintenance as completed'
      });
    }
    
    // Issue reporting
    actions.push({ 
      id: 'report_issue', 
      label: 'Report Issue', 
      icon: 'alert',
      color: 'red',
      description: 'Report equipment problems or issues'
    });
    
    return actions;
  };

  const handleActionSelect = (action: Action) => {
    if (action.id === 'start_pm') {
      setCurrentStep('pm-class-selection');
    } else {
      // Handle other actions
      console.log('Selected action:', action);
      // You can implement specific logic for each action
    }
  };

  const handlePMClassSelect = (pmClass: string) => {
    setSelectedPMClass(pmClass);
    setCurrentStep('pm-checklist');
  };

  const handlePMComplete = () => {
    // Reset to scanning after PM completion
    resetScanner();
  };

  const handlePMBack = () => {
    if (currentStep === 'pm-checklist') {
      setCurrentStep('pm-class-selection');
      setSelectedPMClass(null);
    } else if (currentStep === 'pm-class-selection') {
      setCurrentStep('equipment-info');
    }
  };

  const resetScanner = () => {
    setScannedEquipment(null);
    setPmConfig(null);
    setPmStatus(null);
    setAvailableActions([]);
    setError(null);
    setCurrentStep('scanning');
    setSelectedPMClass(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'green';
      case 'in_use': return 'blue';
      case 'maintenance': return 'yellow';
      case 'down': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div className="enhanced-qr-scanner">
      {/* Header */}
      <div className="scanner-header">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">QR Scanner - PM Workflow</h1>
        <p className="text-gray-600">Scan equipment QR code to access maintenance workflows</p>
      </div>

      {/* QR Scanner Section */}
      {currentStep === 'scanning' && (
        <div className="qr-scanner-section">
          <div className="scanner-container">
            <QrCode className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <p className="text-center text-gray-600 mb-4">
              Point camera at equipment QR code
            </p>
            {/* QR Scanner component would go here */}
            <div className="scanner-placeholder">
              <div className="scanner-frame">
                <div className="scanner-overlay">
                  <div className="scanner-corner top-left"></div>
                  <div className="scanner-corner top-right"></div>
                  <div className="scanner-corner bottom-left"></div>
                  <div className="scanner-corner bottom-right"></div>
                </div>
              </div>
            </div>
            <button 
              className="scan-button"
              onClick={() => handleQRScan('sample-equipment-id')}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                'Simulate QR Scan'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Equipment Info Section */}
      {currentStep === 'equipment-info' && scannedEquipment && (
        <div className="equipment-info-section">
          <div className="equipment-info-card">
            <div className="equipment-header">
              <h3 className="equipment-name">{scannedEquipment.name}</h3>
              <button 
                onClick={resetScanner}
                className="reset-button"
              >
                <RefreshCw className="w-4 h-4" />
                Scan New Equipment
              </button>
            </div>
            
            <div className="equipment-details">
              <div className="detail-row">
                <span className="detail-label">Type:</span>
                <span className="detail-value">{scannedEquipment.type}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className={`status-badge status-${getStatusColor(scannedEquipment.status)}`}>
                  {scannedEquipment.status}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Site:</span>
                <span className="detail-value">{scannedEquipment.site}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Operational Status:</span>
                <span className="detail-value">{scannedEquipment.operational_status}</span>
              </div>
            </div>
            
            {/* PM Status */}
            {pmConfig && pmStatus && (
              <div className="pm-status-section">
                <h4 className="pm-status-title">Maintenance Schedule</h4>
                <div className="pm-details">
                  <div className="pm-detail-row">
                    <span className="pm-detail-label">Last PM:</span>
                    <span className="pm-detail-value">
                      {pmStatus.lastPMDate?.toLocaleDateString() || 'Never'}
                    </span>
                  </div>
                  <div className="pm-detail-row">
                    <span className="pm-detail-label">Next PM:</span>
                    <span className="pm-detail-value">
                      {pmStatus.nextPMDate?.toLocaleDateString() || 'Not scheduled'}
                    </span>
                  </div>
                  <div className="pm-detail-row">
                    <span className="pm-detail-label">Current Hours:</span>
                    <span className="pm-detail-value">
                      {pmStatus.currentHours} hours
                    </span>
                  </div>
                  {pmStatus.isPMDue && (
                    <div className="pm-due-alert">
                      ⚠️ {pmStatus.pmClass} Maintenance Due
                    </div>
                  )}
                </div>
                
                {/* PM Schedule Summary */}
                <div className="pm-schedule-summary">
                  <h5 className="pm-schedule-title">Maintenance Intervals</h5>
                  <div className="pm-class-grid">
                    <div className="pm-class-item">
                      <span className="pm-class-label">Class A:</span>
                      <span className="pm-class-interval">Every {pmConfig['Class A - Hours Interval']} hours</span>
                    </div>
                    <div className="pm-class-item">
                      <span className="pm-class-label">Class B:</span>
                      <span className="pm-class-interval">Every {pmConfig['Class B - Hours Interval']} hours</span>
                    </div>
                    <div className="pm-class-item">
                      <span className="pm-class-label">Class C:</span>
                      <span className="pm-class-interval">Every {pmConfig['Class C - Hours Interval']} hours</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Action Selection */}
          {availableActions.length > 0 && (
            <div className="action-selection-section">
              <h4 className="action-selection-title">Select Action:</h4>
              <div className="action-grid">
                {availableActions.map(action => (
                  <ActionButton
                    key={action.id}
                    action={action}
                    onClick={() => handleActionSelect(action)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PM Class Selection */}
      {currentStep === 'pm-class-selection' && scannedEquipment && pmConfig && (
        <PMClassSelection
          equipment={scannedEquipment}
          pmConfig={pmConfig}
          onSelect={handlePMClassSelect}
          onBack={handlePMBack}
        />
      )}

      {/* PM Checklist */}
      {currentStep === 'pm-checklist' && scannedEquipment && pmConfig && selectedPMClass && (
        <PMChecklist
          equipment={scannedEquipment}
          pmClass={selectedPMClass}
          pmConfig={pmConfig}
          onComplete={handlePMComplete}
          onBack={handlePMBack}
        />
      )}

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
          {error}
        </div>
      )}
    </div>
  );
};

// Action Button Component
const ActionButton: React.FC<{action: Action, onClick: () => void}> = ({action, onClick}) => {
  const getIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      'info': Info,
      'wrench': Wrench,
      'calendar': Calendar,
      'play': Play,
      'square': Square,
      'check': CheckCircle,
      'alert': AlertTriangle
    };
    return icons[iconName] || Info;
  };

  const Icon = getIcon(action.icon);

  return (
    <button 
      className={`action-button action-${action.color}`}
      onClick={onClick}
    >
      <Icon className="action-icon" />
      <span className="action-label">{action.label}</span>
      {action.description && (
        <span className="action-description">{action.description}</span>
      )}
    </button>
  );
};

export default EnhancedQRScanner;
