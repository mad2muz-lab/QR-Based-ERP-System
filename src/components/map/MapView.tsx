import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Users, Wrench, Package, Building, Eye, ArrowLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { DataStorage } from '../../utils/dataStorage';
import { AuthManager } from '../../utils/authUtils';
import { fetchData, getAllLogs } from '../../utils/dataProxy';
import { Employee, Equipment, Material, Site, TimeLog } from '../../types';
import HierarchicalDropdown, { NavigationItem } from '../navigation/HierarchicalDropdown';
import SiteDetailView from './SiteDetailView';
import UnauthorizedAccess from '../common/UnauthorizedAccess';

const MapView: React.FC = () => {
  // Check if user has operator access
  const hasOperatorAccess = AuthManager.hasPermission('operator');
  
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [hoveredProvince, setHoveredProvince] = useState<string>('');
  const [hoveredSite, setHoveredSite] = useState<string>('');
  const [ksaGeoData, setKsaGeoData] = useState<any>(null);
  const [drillDownLevel, setDrillDownLevel] = useState<'country' | 'province' | 'site'>('country');
  const [drillDownHistory, setDrillDownHistory] = useState<Array<{level: string, data: any}>>([{ level: 'country', data: null }]);
  const [activeCallout, setActiveCallout] = useState<{type: 'province' | 'site', id: string, position: {x: number, y: number}} | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [dataTimestamp, setDataTimestamp] = useState<number>(Date.now());
  const [showDetailView, setShowDetailView] = useState(false);

  // Zoom and pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // State for data
  const [showNavigation, setShowNavigation] = useState(false);
  const [sites, setSites] = useState<Site[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [mapDebug, setMapDebug] = useState<string>('');

  if (!hasOperatorAccess) {
    return <UnauthorizedAccess requiredRole="operator" />;
  }

  // Load data with refresh capability
  const loadData = useCallback(async () => {
    try {
      const [sitesData, employeesData, equipmentData, materialsData, logsData] = await Promise.all([
        fetchData('sites'),
        fetchData('employees'),
        fetchData('equipment'),
        fetchData('materials'),
        getAllLogs()
      ]);
      
      setSites(sitesData as Site[]);
      console.log("Loaded sites:", sitesData);
      setMapDebug(`Loaded ${sitesData.length} sites`);
      setEmployees(employeesData as Employee[]);
      setEquipment(equipmentData as Equipment[]);
      setMaterials(materialsData as Material[]);
      
      // Handle logs data (could be array or object with separate log types)
      if (Array.isArray(logsData)) {
        setTimeLogs(logsData as TimeLog[]);
      } else if (logsData && typeof logsData === 'object' && logsData.employeeLogs) {
        // Combine all log types into a single array for backward compatibility
        const allLogs = [
          ...(logsData.employeeLogs || []),
          ...(logsData.equipmentLogs || []),
          ...(logsData.materialLogs || []),
          ...(logsData.siteLogs || [])
        ];
        setTimeLogs(allLogs as TimeLog[]);
      } else {
        setTimeLogs([]);
      }
      
      setDataTimestamp(Date.now());
    } catch (error) {
      console.error('Error loading data:', error);
      setMapDebug('Error loading data');
    }
  }, []);

  // Initial data load
  useEffect(() => {
    loadData();
    
    // Set up auto-refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      loadData();
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, [loadData]);

  // Load KSA GeoJSON data
  useEffect(() => {
    const loadKSAData = async () => {
      try {
        const response = await fetch('https://raw.githubusercontent.com/wjdanalharthi/GeoJSON-of-Saudi-Arabia-Regions/436a05818ff05b433997761c212cc0d4c3480867/data/SA_regions.json');
        const data = await response.json();
        setKsaGeoData(data);
      } catch (error) {
        console.error('Failed to load KSA GeoJSON data:', error);
        // Fallback to simplified data if fetch fails
        setKsaGeoData(createFallbackKSAData());
      }
    };

    loadKSAData();
  }, []);

  // Create fallback KSA data if GeoJSON fails to load
  const createFallbackKSAData = () => ({
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { name_en: "Riyadh", name_ar: "الرياض" },
        geometry: { type: "Polygon", coordinates: [[[46.5, 24.5], [47.5, 24.5], [47.5, 25.5], [46.5, 25.5], [46.5, 24.5]]] }
      },
      {
        type: "Feature",
        properties: { name_en: "Eastern Province", name_ar: "المنطقة الشرقية" },
        geometry: { type: "Polygon", coordinates: [[[49.5, 25.5], [50.5, 25.5], [50.5, 26.5], [49.5, 26.5], [49.5, 25.5]]] }
      },
      {
        type: "Feature",
        properties: { name_en: "Makkah", name_ar: "مكة المكرمة" },
        geometry: { type: "Polygon", coordinates: [[[39.0, 21.0], [40.0, 21.0], [40.0, 22.0], [39.0, 22.0], [39.0, 21.0]]] }
      }
    ]
  });

  // Calculate site statistics based on QR scan logs
  const calculateSiteStats = (siteId: string) => {
    const siteEmployees = employees.filter(emp => emp.site === siteId);
    const siteEquipment = equipment.filter(eq => eq.site === siteId);
    const siteMaterials = materials.filter(mat => mat.site === siteId);
    
    // Return zero stats if no data
    if (siteEmployees.length === 0 && siteEquipment.length === 0 && siteMaterials.length === 0) {
      return {
        totalEmployees: 0,
        activeEmployees: 0,
        totalEquipment: 0,
        activeEquipment: 0,
        totalMaterials: 0,
        availableMaterials: 0
      };
    }
    
    // Get active employees (those who clocked in today)
    const today = new Date().toDateString();
    const activeEmployees = siteEmployees.filter(emp => {
      const recentLog = timeLogs
        .filter(log => log.entityId === emp.id && log.entityType === 'employee')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      return recentLog?.action === 'clock-in' && new Date(recentLog.timestamp).toDateString() === today;
    });

    // Get equipment in use
    const activeEquipment = siteEquipment.filter(eq => {
      const recentLog = timeLogs
        .filter(log => log.entityId === eq.id && log.entityType === 'equipment')
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      return recentLog?.action === 'start-use';
    });

    return {
      totalEmployees: siteEmployees.length,
      activeEmployees: activeEmployees.length,
      totalEquipment: siteEquipment.length,
      activeEquipment: activeEquipment.length,
      totalMaterials: siteMaterials.length,
      availableMaterials: siteMaterials.filter(mat => mat.status === 'available').length
    };
  };

  // Calculate province statistics
  const calculateProvinceStats = (provinceName: string) => {
    const provinceSites = sites.filter(site => site.province === provinceName);
    
    // Return zero stats if no sites in province
    if (provinceSites.length === 0) {
      return {
        sites: 0,
        totalEmployees: 0,
        activeEmployees: 0,
        totalEquipment: 0,
        activeEquipment: 0,
        totalMaterials: 0
      };
    }
    
    let totalEmployees = 0;
    let activeEmployees = 0;
    let totalEquipment = 0;
    let activeEquipment = 0;
    let totalMaterials = 0;

    provinceSites.forEach(site => {
      const stats = calculateSiteStats(site.id);
      totalEmployees += stats.totalEmployees;
      activeEmployees += stats.activeEmployees;
      totalEquipment += stats.totalEquipment;
      activeEquipment += stats.activeEquipment;
      totalMaterials += stats.totalMaterials;
    });

    return {
      sites: provinceSites.length,
      totalEmployees,
      activeEmployees,
      totalEquipment,
      activeEquipment,
      totalMaterials
    };
  };

  // Handle province click for drill down
  const handleProvinceClick = (provinceName: string) => {
    if (drillDownLevel === 'country') {
      setDrillDownHistory([{ level: 'country', data: null }]);
      setSelectedProvince(provinceName);
      setDrillDownLevel('province');
      setHoveredProvince('');
      setActiveCallout(null);
    }
  };

  // Handle site click for drill down
  const handleSiteClick = (siteId: string) => {
    if (drillDownLevel === 'province') {
      setDrillDownHistory(prev => [...prev, { level: 'province', data: selectedProvince }]);
      
      // Check if site has data
      const stats = calculateSiteStats(siteId);
      if (stats.totalEmployees > 0 || stats.totalEquipment > 0 || stats.totalMaterials > 0) {
        setSelectedSite(siteId);
        setShowDetailView(true);
      } else {
        setSelectedSite(siteId);
        setDrillDownLevel('site');
      }
      
      setHoveredSite('');
      setActiveCallout(null);
    }
  };

  // Handle drill up navigation
  const handleDrillUp = () => {
    if (drillDownHistory.length > 0) {
      const previous = drillDownHistory[drillDownHistory.length - 1];
      setDrillDownHistory(prev => prev.slice(0, -1));
      
      if (previous.level === 'country') {
        setDrillDownLevel('country');
        setSelectedProvince('');
        setSelectedSite('');
      } else if (previous.level === 'province') {
        setDrillDownLevel('province');
        setSelectedProvince(previous.data);
        setSelectedSite('');
      }
      setActiveCallout(null);
    }
  };

  // Handle callout drill down
  const handleCalloutDrillDown = (type: 'province' | 'site', id: string) => {
    if (type === 'province') {
      handleProvinceClick(id);
    } else if (type === 'site') {
      // Check if site has data
      const stats = calculateSiteStats(id);
      if (stats.totalEmployees > 0 || stats.totalEquipment > 0 || stats.totalMaterials > 0) {
        setSelectedSite(id);
        setShowDetailView(true);
        setActiveCallout(null);
      } else {
        handleSiteClick(id);
      }
    }
  };

  // Convert GeoJSON coordinates to SVG path
  const geoJSONToSVGPath = (coordinates: any[], bounds: any) => {
    const paths: string[] = [];
    
    const coordToSVG = (coord: [number, number]) => {
      const x = ((coord[0] - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 800;
      const y = 600 - ((coord[1] - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 600;
      return [x, y];
    };

    if (coordinates[0] && Array.isArray(coordinates[0][0])) {
      // MultiPolygon or Polygon with holes
      coordinates.forEach(ring => {
        if (Array.isArray(ring[0][0])) {
          // MultiPolygon
          ring.forEach((polygon: any) => {
            const pathData = polygon.map((coord: [number, number], index: number) => {
              const [x, y] = coordToSVG(coord);
              return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ') + ' Z';
            paths.push(pathData);
          });
        } else {
          // Simple polygon
          const pathData = ring.map((coord: [number, number], index: number) => {
            const [x, y] = coordToSVG(coord);
            return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
          }).join(' ') + ' Z';
          paths.push(pathData);
        }
      });
    }
    
    return paths.join(' ');
  };

  // Calculate bounds for KSA
  const calculateBounds = (geoData: any) => {
    let minLng = Infinity, maxLng = -Infinity;
    let minLat = Infinity, maxLat = -Infinity;

    geoData.features.forEach((feature: any) => {
      const coords = feature.geometry.coordinates;
      const flattenCoords = (arr: any[]): [number, number][] => {
        const result: [number, number][] = [];
        const flatten = (item: any) => {
          if (Array.isArray(item) && typeof item[0] === 'number') {
            result.push([item[0], item[1]]);
          } else if (Array.isArray(item)) {
            item.forEach(flatten);
          }
        };
        flatten(arr);
        return result;
      };

      const allCoords = flattenCoords(coords);
      allCoords.forEach(([lng, lat]) => {
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
      });
    });

    return { minLng, maxLng, minLat, maxLat };
  };

  // Get site position on SVG
  const getSitePosition = (site: any, bounds: any) => {
    const x = ((site.coordinates[0] - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 800;
    const y = 600 - ((site.coordinates[1] - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 600;
    
    // Only log for a few sites to avoid console spam
    if (Math.random() < 0.2) {
      console.log(`Site position for ${site.name}: x=${x}, y=${y}, coords=[${site.coordinates[0]}, ${site.coordinates[1]}]`);
    }
    return { x, y };
  };

  // Handle site marker click with callout
  const handleSiteMarkerClick = (siteId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Don't show callout if no data for this site
    const stats = calculateSiteStats(siteId);
    if (stats.totalEmployees === 0 && stats.totalEquipment === 0 && stats.totalMaterials === 0) {
      return;
    }
    
    const rect = mapContainerRef.current?.getBoundingClientRect();
    if (rect) {
      const position = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
      
      setActiveCallout({
        type: 'site',
        id: siteId,
        position
      });
    }
  };

  // Handle province hover with callout
  const handleProvinceHover = (provinceName: string, event: React.MouseEvent) => {
    if (drillDownLevel === 'country') {
      // Don't show callout if no data for this province
      const stats = calculateProvinceStats(provinceName);
      if (stats.sites === 0) {
        return;
      }
      
      const rect = mapContainerRef.current?.getBoundingClientRect();
      if (rect) {
        const position = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        };
        
        setActiveCallout({
          type: 'province',
          id: provinceName,
          position
        });
      }
    }
  };

  // Close callout when clicking outside
  const handleMapClick = () => {
    setActiveCallout(null);
  };

  // Sample navigation data for the hierarchical dropdown
  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      onClick: () => console.log('Dashboard clicked')
    },
    {
      id: 'employees',
      label: 'Employees',
      children: [
        {
          id: 'emp-list',
          label: 'View All Employees',
          onClick: () => console.log('View employees clicked')
        },
        {
          id: 'emp-add',
          label: 'Add Employee',
          onClick: () => console.log('Add employee clicked')
        },
        {
          id: 'emp-departments',
          label: 'Departments',
          children: [
            {
              id: 'dept-engineering',
              label: 'Engineering',
              onClick: () => console.log('Engineering department clicked')
            },
            {
              id: 'dept-operations',
              label: 'Operations',
              onClick: () => console.log('Operations department clicked')
            }
          ]
        }
      ]
    },
    {
      id: 'equipment',
      label: 'Equipment',
      children: [
        {
          id: 'equip-list',
          label: 'View All Equipment',
          onClick: () => console.log('View equipment clicked')
        },
        {
          id: 'equip-add',
          label: 'Add Equipment',
          onClick: () => console.log('Add equipment clicked')
        }
      ]
    },
    {
      id: 'materials',
      label: 'Materials',
      children: [
        {
          id: 'mat-list',
          label: 'View All Materials',
          onClick: () => console.log('View materials clicked')
        },
        {
          id: 'mat-add',
          label: 'Add Material',
          onClick: () => console.log('Add material clicked')
        }
      ]
    }
  ];

  // Zoom and pan handlers
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.5, 5)); // Max zoom 5x
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.5, 0.5)); // Min zoom 0.5x
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(5, zoom * delta));
    
    // Calculate zoom center point
    const rect = mapContainerRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Adjust pan to zoom towards mouse position
      const zoomRatio = newZoom / zoom;
      setPan(prev => ({
        x: mouseX - (mouseX - prev.x) * zoomRatio,
        y: mouseY - (mouseY - prev.y) * zoomRatio
      }));
    }
    
    setZoom(newZoom);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left mouse button
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Calculate transformed viewBox
  const getTransformedViewBox = () => {
    const baseWidth = 800;
    const baseHeight = 600;
    const scaledWidth = baseWidth / zoom;
    const scaledHeight = baseHeight / zoom;
    
    return `${pan.x / zoom} ${pan.y / zoom} ${scaledWidth} ${scaledHeight}`;
  };

  if (!ksaGeoData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading KSA map data...</p>
        </div>
      </div>
    );
  }

  const bounds = calculateBounds(ksaGeoData);
  const filteredSites = selectedProvince 
    ? sites.filter(site => site.province === selectedProvince)
    : sites;

  // Filter sites that have actual data
  // Show all sites regardless of data for now to debug the issue
  const sitesWithData = filteredSites.filter(site => 
    site.coordinates && 
    Array.isArray(site.coordinates) && 
    site.coordinates.length === 2 &&
    typeof site.coordinates[0] === 'number' && 
    typeof site.coordinates[1] === 'number' &&
    site.coordinates[0] !== 0 && 
    site.coordinates[1] !== 0
  );

  const selectedSiteData = sites.find(site => site.id === selectedSite);

  return (
    <div className="space-y-6">
      {/* Site Detail View */}
      {showDetailView && selectedSiteData && (
        <SiteDetailView
          site={selectedSiteData}
          employees={employees}
          equipment={equipment}
          materials={materials}
          onBack={() => {
            setShowDetailView(false);
            setSelectedSite('');
          }}
        />
      )}
      
      {!showDetailView && (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <MapPin className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">KSA Operations Map</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Kingdom of Saudi Arabia</span>
                {drillDownLevel !== 'country' && (
                  <>
                    <ChevronRight className="w-3 h-3" />
                    <span>{selectedProvince}</span>
                  </>
                )}
                {drillDownLevel === 'site' && (
                  <>
                    <ChevronRight className="w-3 h-3" />
                    <span>{selectedSiteData?.name}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            {drillDownLevel !== 'country' && (
              <button
                onClick={handleDrillUp}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}
            
            {/* Hierarchical Dropdown Navigation */}
            <button
              onClick={() => setShowNavigation(!showNavigation)}
              className="relative flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>Navigation Menu</span>
              
              {showNavigation && (
                <div className="absolute top-full right-0 mt-2 z-50">
                  <HierarchicalDropdown items={navigationItems} title="Navigation Menu" />
                </div>
              )}
            </button>
          </div>
        </div>

        <div className="relative rounded-xl p-2">
          {/* Zoom Controls */}
          <div className="absolute top-4 right-4 z-40 flex flex-col space-y-2">
            <button
              onClick={handleZoomIn}
              className="w-10 h-10 bg-white rounded-lg shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={handleZoomOut}
              className="w-10 h-10 bg-white rounded-lg shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={handleResetZoom}
              className="w-10 h-10 bg-white rounded-lg shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
              title="Reset Zoom"
            >
              <RotateCcw className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {/* Zoom Level Indicator */}
          <div className="absolute top-4 left-4 z-40 bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2">
            <span className="text-sm font-medium text-gray-700">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          <div 
            ref={mapContainerRef}
            className="relative bg-white rounded-lg p-2 overflow-hidden"
            onClick={handleMapClick}
            onWheel={handleMouseWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            <svg 
              viewBox={getTransformedViewBox()} 
              className="w-full h-auto max-h-[500px] transition-transform duration-200"
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
              {/* Render KSA provinces */}
              {ksaGeoData.features.map((feature: any, index: number) => {
                const provinceName = feature.properties.name_en;
                const isSelected = selectedProvince === provinceName;
                const shouldShow = drillDownLevel === 'country' || 
                                 (drillDownLevel === 'province' && isSelected);

                if (!shouldShow) return null;

                return (
                  <g key={index}>
                    <path
                      d={geoJSONToSVGPath(feature.geometry.coordinates, bounds)}
                      fill={isSelected ? '#1e3a8a' : '#e5e7eb'}
                      stroke="#374151"
                      strokeWidth="1"
                      className="cursor-pointer transition-all duration-300 hover:fill-blue-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProvinceClick(provinceName);
                      }}
                      onMouseEnter={(e) => handleProvinceHover(provinceName, e)}
                    />
                  </g>
                );
              })}

              {/* Render site markers - LARGER SIZE */}
              {sitesWithData.map((site) => {
                const position = getSitePosition(site, bounds);
                // Only log for a few sites to avoid console spam
                if (Math.random() < 0.1) {
                  console.log(`Rendering site marker: ${site.name}, position: ${JSON.stringify(position)}, coordinates: [${site.coordinates[0]}, ${site.coordinates[1]}]`);
                }
                const isSelected = selectedSite === site.id;
                
                return (
                  <g key={site.id}>
                    {/* Outer ring for better visibility */}
                    <circle
                      cx={position.x}
                      cy={position.y}
                      r="12"
                      fill="rgba(59, 130, 246, 0.8)"
                      stroke="#ffffff"
                      strokeWidth="3"
                      className="cursor-pointer transition-all duration-300 hover:r-20"
                      onClick={(e) => handleSiteMarkerClick(site.id, e)}
                    />
                    {/* Inner circle */}
                    <circle
                      cx={position.x}
                      cy={position.y}
                      r="6"
                      fill={isSelected ? "#dc2626" : "#ffffff"}
                      className="cursor-pointer transition-all duration-300 pointer-events-none"
                    />
                    {/* Site name label */}
                    <text
                      x={position.x}
                      y={position.y - 25}
                      textAnchor="middle"
                      className="fill-gray-700 text-sm font-medium pointer-events-none"
                      style={{ textShadow: "0px 0px 5px white, 0px 0px 5px white" }}
                    >
                      {site.name.length > 15 ? site.name.substring(0, 12) + '...' : site.name}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Active Callout - CLICKABLE AND PERSISTENT */}
            {activeCallout && (
              <div 
                className="absolute bg-white rounded-xl shadow-2xl p-6 border-2 border-blue-200 min-w-80 z-30 pointer-events-auto"
                style={{
                  left: Math.min(activeCallout.position.x + 20, window.innerWidth - 350),
                  top: Math.max(activeCallout.position.y - 150, 10),
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {activeCallout.type === 'province' && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Eye className="w-5 h-5 text-blue-600" />
                        <h4 className="font-bold text-gray-900 text-lg">{activeCallout.id}</h4>
                      </div>
                      <button
                        onClick={() => setActiveCallout(null)}
                        className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                      >
                        ×
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {(() => {
                        const stats = calculateProvinceStats(activeCallout.id);
                        return (
                          <>
                            <div className="bg-blue-50 rounded-lg p-3">
                              <div className="flex items-center space-x-2 mb-1">
                                <Building className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium text-gray-700">Sites</span>
                              </div>
                              <div className="text-2xl font-bold text-blue-600">{stats.sites}</div>
                              {stats.sites === 0 && (
                                <div className="text-xs text-gray-400 mt-1">No registered sites</div>
                              )}
                            </div>
                            
                            <div className="bg-green-50 rounded-lg p-3">
                              <div className="flex items-center space-x-2 mb-1">
                                <Users className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium text-gray-700">Employees</span>
                              </div>
                              <div className="text-lg font-bold text-green-600">
                                {stats.activeEmployees}/{stats.totalEmployees}
                              </div>
                              <div className="text-xs text-gray-500">
                                {stats.totalEmployees === 0 ? 'No employees' : 'Active/Total'}
                              </div>
                            </div>
                            
                            <div className="bg-orange-50 rounded-lg p-3">
                              <div className="flex items-center space-x-2 mb-1">
                                <Wrench className="w-4 h-4 text-orange-600" />
                                <span className="text-sm font-medium text-gray-700">Equipment</span>
                              </div>
                              <div className="text-lg font-bold text-orange-600">
                                {stats.activeEquipment}/{stats.totalEquipment}
                              </div>
                              <div className="text-xs text-gray-500">
                                {stats.totalEquipment === 0 ? 'No equipment' : 'In Use/Total'}
                              </div>
                            </div>
                            
                            <div className="bg-purple-50 rounded-lg p-3">
                              <div className="flex items-center space-x-2 mb-1">
                                <Package className="w-4 h-4 text-purple-600" />
                                <span className="text-sm font-medium text-gray-700">Materials</span>
                              </div>
                              <div className="text-2xl font-bold text-purple-600">{stats.totalMaterials}</div>
                              {stats.totalMaterials === 0 && (
                                <div className="text-xs text-gray-400 mt-1">No materials</div>
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    
                    <button
                      onClick={() => handleCalloutDrillDown('province', activeCallout.id)}
                      className={`w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                        (() => {
                          const stats = calculateProvinceStats(activeCallout.id);
                          return stats.sites > 0 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed';
                        })()
                      }`}
                      disabled={(() => {
                        const stats = calculateProvinceStats(activeCallout.id);
                        return stats.sites === 0;
                      })()}
                    >
                      <span>View Province Details</span>
                      {(() => {
                        const stats = calculateProvinceStats(activeCallout.id);
                        return stats.sites > 0 ? <ChevronRight className="w-4 h-4" /> : null;
                      })()}
                    </button>
                  </>
                )}

                {activeCallout.type === 'site' && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Building className="w-5 h-5 text-blue-600" />
                        <h4 className="font-bold text-gray-900 text-lg">
                          {sites.find(s => s.id === activeCallout.id)?.name}
                        </h4>
                      </div>
                      <button
                        onClick={() => setActiveCallout(null)}
                        className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                      >
                        ×
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3 mb-4">
                      {(() => {
                        const stats = calculateSiteStats(activeCallout.id);
                        return (
                          <>
                            <div className="bg-green-50 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Users className="w-4 h-4 text-green-600" />
                                  <span className="text-sm font-medium text-gray-700">Active Employees</span>
                                </div>
                                <div className="text-lg font-bold text-green-600">
                                  {stats.activeEmployees}/{stats.totalEmployees}
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-blue-50 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Wrench className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm font-medium text-gray-700">Active Equipment</span>
                                </div>
                                <div className="text-lg font-bold text-blue-600">
                                  {stats.activeEquipment}/{stats.totalEquipment}
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-orange-50 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Package className="w-4 h-4 text-orange-600" />
                                  <span className="text-sm font-medium text-gray-700">Available Materials</span>
                                </div>
                                <div className="text-lg font-bold text-orange-600">
                                  {stats.availableMaterials}/{stats.totalMaterials}
                                </div>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    
                    <button
                      onClick={() => handleCalloutDrillDown('site', activeCallout.id)}
                      className={`w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                        'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      <span>View Site Details</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-4 p-3 bg-gray-100 rounded-lg text-sm">
          <p>Map Debug: {mapDebug}</p>
          <p>Total Sites: {sites.length}, Filtered Sites: {filteredSites.length}, Sites With Data: {sitesWithData.length}</p>
          <p>First Site Coordinates (if any): {sites.length > 0 ? JSON.stringify(sites[0].coordinates) : 'No sites'}</p>
          <p>Zoom Level: {Math.round(zoom * 100)}%, Pan: ({Math.round(pan.x)}, {Math.round(pan.y)})</p>
        </div>

        {/* Site Details Panel - ONLY SHOWN WHEN DRILLED DOWN TO SITE LEVEL */}
        {drillDownLevel === 'site' && selectedSiteData && (
          <div className="mt-6 bg-gray-50 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Building className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">{selectedSiteData.name} - Detailed Statistics</h3>
            </div>
            
            {(() => {
              const stats = calculateSiteStats(selectedSite);
              const siteEmployees = employees.filter(emp => emp.site === selectedSite);
              const siteEquipment = equipment.filter(eq => eq.site === selectedSite);
              const siteMaterials = materials.filter(mat => mat.site === selectedSite);
              
              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Employees Section */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <Users className="w-5 h-5 text-green-600" />
                      <h4 className="font-semibold text-gray-900">Employees</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span className="font-medium">{stats.totalEmployees}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Today:</span>
                        <span className="font-medium text-green-600">{stats.activeEmployees}</span>
                      </div>
                      <div className="mt-3 space-y-1">
                        {siteEmployees.slice(0, 3).map(emp => (
                          <div key={emp.id} className="text-xs text-gray-600">
                            {emp.name} - {emp.department}
                          </div>
                        ))}
                        {siteEmployees.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{siteEmployees.length - 3} more...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Equipment Section */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <Wrench className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-gray-900">Equipment</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span className="font-medium">{stats.totalEquipment}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>In Use:</span>
                        <span className="font-medium text-blue-600">{stats.activeEquipment}</span>
                      </div>
                      <div className="mt-3 space-y-1">
                        {siteEquipment.slice(0, 3).map(eq => (
                          <div key={eq.id} className="text-xs text-gray-600">
                            {eq.name} - {eq.status}
                          </div>
                        ))}
                        {siteEquipment.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{siteEquipment.length - 3} more...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Materials Section */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <Package className="w-5 h-5 text-orange-600" />
                      <h4 className="font-semibold text-gray-900">Materials</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Types:</span>
                        <span className="font-medium">{stats.totalMaterials}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Available:</span>
                        <span className="font-medium text-green-600">{stats.availableMaterials}</span>
                      </div>
                      <div className="mt-3 space-y-1">
                        {siteMaterials.slice(0, 3).map(mat => (
                          <div key={mat.id} className="text-xs text-gray-600">
                            {mat.name} - {mat.quantity} {mat.unit}
                          </div>
                        ))}
                        {siteMaterials.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{siteMaterials.length - 3} more...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
      )}
    </div>
  );  
};

export default MapView;