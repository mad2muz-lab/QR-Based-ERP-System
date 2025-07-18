import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Plus, X, Check } from 'lucide-react';
import { ksaCitiesData, CityData } from '../../data/ksaCitiesData';
import { SupabaseRegistrationService } from '../../utils/supabaseRegistrationService';
import { AuthManager } from '../../utils/authUtils';

interface SearchableLocationDropdownProps {
  value: string;
  onChange: (city: string, coordinates: [number, number], province: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

const SearchableLocationDropdown: React.FC<SearchableLocationDropdownProps> = ({
  value,
  onChange,
  placeholder = "Search for a city...",
  className = "",
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customLocation, setCustomLocation] = useState({
    city: '',
    latitude: '',
    longitude: '',
    province: ''
  });
  const [filteredCities, setFilteredCities] = useState<CityData[]>(ksaCitiesData);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentUser = AuthManager.getCurrentUserSync();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'developer';
  // Allow custom locations for all users
  const canAddCustomLocation = true;

  // Filter cities based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCities(ksaCitiesData);
    } else {
      const filtered = ksaCitiesData.filter(city =>
        city.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        city.province.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCities(filtered);
    }
  }, [searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCustomForm(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCitySelect = (city: CityData) => {
    onChange(city.city, [city.longitude, city.latitude], city.province);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Remove the event argument from handleCustomLocationSubmit
  const handleCustomLocationSubmit = async () => {
    if (!customLocation.city || !customLocation.latitude || !customLocation.longitude || !customLocation.province) {
      alert('Please fill in all required fields');
      return;
    }

    const lat = parseFloat(customLocation.latitude);
    const lng = parseFloat(customLocation.longitude);

    if (isNaN(lat) || isNaN(lng)) {
      alert('Please enter valid latitude and longitude values');
      return;
    }

    // Check if Supabase is enabled
    const useSupabase = AuthManager.useSupabase ? await AuthManager.useSupabase() : false;
    if (useSupabase) {
      const result = await SupabaseRegistrationService.createLocationWithDuplicateCheck({
        city: customLocation.city,
        province: customLocation.province,
        latitude: lat,
        longitude: lng,
        source: 'custom'
      });
      if (result.duplicate) {
        alert('This location already exists in the database.');
      }
      // Proceed regardless, so the user can use the location for the site
    }

    onChange(customLocation.city, [lng, lat], customLocation.province);
    setShowCustomForm(false);
    setIsOpen(false);
    setCustomLocation({ city: '', latitude: '', longitude: '', province: '' });
  };

  const resetCustomForm = () => {
    setCustomLocation({ city: '', latitude: '', longitude: '', province: '' });
    setShowCustomForm(false);
  };

  const selectedCity = ksaCitiesData.find(city => city.city === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <div
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent cursor-pointer bg-white ${className}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className={value ? 'text-gray-900' : 'text-gray-500'}>
              {value || placeholder}
            </span>
            {selectedCity && (
              <span className="text-xs text-gray-500 ml-auto">
                {selectedCity.province}
              </span>
            )}
          </div>
        </div>
        
        {required && !value && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <span className="text-red-500 text-sm">*</span>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {!showCustomForm ? (
            <>
              {/* Search Input */}
              <div className="p-3 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search cities or provinces..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
              </div>

              {/* Cities List */}
              <div className="max-h-60 overflow-y-auto">
                {filteredCities.length > 0 ? (
                  <div className="py-1">
                    {filteredCities.map((city, index) => (
                      <div
                        key={index}
                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => handleCitySelect(city)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">{city.city}</div>
                            <div className="text-sm text-gray-500">{city.province}</div>
                          </div>
                          <div className="text-xs text-gray-400">
                            {city.latitude.toFixed(4)}, {city.longitude.toFixed(4)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-gray-500">
                    <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p>No cities found matching "{searchTerm}"</p>
                    {canAddCustomLocation && (
                      <button
                        onClick={() => setShowCustomForm(true)}
                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Add custom location
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Add Custom Location Button for All Users */}
              {canAddCustomLocation && (
                <div className="p-3 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={() => setShowCustomForm(true)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Custom Location</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Custom Location Form */
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Add Custom Location</h3>
                <button
                  onClick={resetCustomForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Replace <form> with <div> and use button onClick */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City Name *
                  </label>
                  <input
                    type="text"
                    value={customLocation.city}
                    onChange={(e) => setCustomLocation({ ...customLocation, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter city name"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Latitude *
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={customLocation.latitude}
                      onChange={(e) => setCustomLocation({ ...customLocation, latitude: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="24.7136"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Longitude *
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={customLocation.longitude}
                      onChange={(e) => setCustomLocation({ ...customLocation, longitude: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="46.6753"
                      required
                    />
                  </div>
                  <select
                    value={customLocation.province}
                    onChange={(e) => setCustomLocation({ ...customLocation, province: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select province</option>
                    <option value="Riyadh">Riyadh</option>
                    <option value="Eastern Province">Eastern Province</option>
                    <option value="Makkah">Makkah</option>
                    <option value="Asir">Asir</option>
                    <option value="Jizan">Jizan</option>
                    <option value="Madinah">Madinah</option>
                    <option value="Qassim">Qassim</option>
                    <option value="Tabuk">Tabuk</option>
                    <option value="Hail">Hail</option>
                    <option value="Northern Borders">Northern Borders</option>
                    <option value="Najran">Najran</option>
                    <option value="Al Bahah">Al Bahah</option>
                    <option value="Al Jawf">Al Jawf</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCustomLocationSubmit}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span>Add Location</span>
                  </button>
                  <button
                    type="button"
                    onClick={resetCustomForm}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableLocationDropdown;