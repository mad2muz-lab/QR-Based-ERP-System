import React from 'react';
import { Wrench, Clock, Calendar, CheckCircle } from 'lucide-react';

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

interface PMClassSelectionProps {
  equipment: Equipment;
  pmConfig: PMConfig;
  onSelect: (pmClass: string) => void;
  onBack: () => void;
}

const PMClassSelection: React.FC<PMClassSelectionProps> = ({ equipment, pmConfig, onSelect, onBack }) => {
  const pmClasses = [
    {
      class: 'A',
      interval: pmConfig['Class A - Hours Interval'],
      threshold: pmConfig['Class A - Threshold Hours'],
      description: 'Routine maintenance - Daily/Weekly checks',
      icon: CheckCircle,
      color: 'green',
      features: [
        'Daily walk-around inspection',
        'Check fluid levels',
        'Clean equipment',
        'Basic safety checks'
      ]
    },
    {
      class: 'B', 
      interval: pmConfig['Class B - Hours Interval'],
      threshold: pmConfig['Class B - Threshold Hours'],
      description: 'Scheduled maintenance - Monthly service',
      icon: Wrench,
      color: 'orange',
      features: [
        'Change oil and filters',
        'Inspect brake system',
        'Check electrical system',
        'Lubricate moving parts'
      ]
    },
    {
      class: 'C',
      interval: pmConfig['Class C - Hours Interval'], 
      threshold: pmConfig['Class C - Threshold Hours'],
      description: 'Major maintenance - Quarterly/Annual overhaul',
      icon: Clock,
      color: 'red',
      features: [
        'Major component inspection',
        'Replace worn parts',
        'Calibrate systems',
        'Comprehensive testing'
      ]
    }
  ];

  return (
    <div className="pm-class-selection">
      {/* Header */}
      <div className="pm-class-header">
        <button 
          onClick={onBack}
          className="back-button"
        >
          ← Back to Equipment
        </button>
        <h2 className="pm-class-title">Select Preventive Maintenance Type</h2>
        <p className="pm-class-subtitle">
          Choose the maintenance class for {equipment.name} ({equipment.type})
        </p>
      </div>

      {/* PM Class Cards */}
      <div className="pm-class-grid">
        {pmClasses.map(pmClass => {
          const Icon = pmClass.icon;
          return (
            <div 
              key={pmClass.class} 
              className={`pm-class-card pm-class-${pmClass.color}`}
              onClick={() => onSelect(pmClass.class)}
            >
              <div className="pm-class-header">
                <div className="pm-class-icon">
                  <Icon className={`w-8 h-8 text-${pmClass.color}-600`} />
                </div>
                <div className="pm-class-info">
                  <h3 className="pm-class-name">Class {pmClass.class} Maintenance</h3>
                  <p className="pm-class-interval">
                    Every {pmClass.interval} hours
                  </p>
                </div>
              </div>
              
              <p className="pm-class-description">{pmClass.description}</p>
              
              <div className="pm-class-details">
                <div className="pm-class-detail-item">
                  <span className="detail-label">Threshold:</span>
                  <span className="detail-value">{pmClass.threshold} hours</span>
                </div>
                <div className="pm-class-detail-item">
                  <span className="detail-label">Frequency:</span>
                  <span className="detail-value">
                    {pmClass.class === 'A' ? 'Weekly' : 
                     pmClass.class === 'B' ? 'Monthly' : 'Quarterly'}
                  </span>
                </div>
              </div>

              <div className="pm-class-features">
                <h4 className="features-title">Typical Tasks:</h4>
                <ul className="features-list">
                  {pmClass.features.map((feature, index) => (
                    <li key={index} className="feature-item">
                      • {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pm-class-action">
                <button className={`select-pm-button pm-${pmClass.color}`}>
                  Select Class {pmClass.class}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Equipment Info Summary */}
      <div className="equipment-summary">
        <h4 className="summary-title">Equipment Summary</h4>
        <div className="summary-details">
          <div className="summary-item">
            <span className="summary-label">Equipment:</span>
            <span className="summary-value">{equipment.equipment_name}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Type:</span>
            <span className="summary-value">{equipment.equipment_type}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Site:</span>
            <span className="summary-value">{equipment.site}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Status:</span>
            <span className={`summary-value status-${equipment.status}`}>
              {equipment.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PMClassSelection;
