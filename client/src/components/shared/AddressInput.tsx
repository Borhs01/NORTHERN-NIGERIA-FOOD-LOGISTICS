import { useEffect, useRef, useState } from 'react';
import { MapPin, Loader, AlertCircle, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { searchLocationsWithCoverage, getCurrentLocationEnhanced, type EnhancedAddressData } from '../../utils/locationService';
import { STATES } from '../../utils/constants';
import type { DetailedAddressData } from '../../utils/geolocation';

interface AddressInputProps {
  onAddressChange: (address: Partial<DetailedAddressData>) => void;
  initialState?: string;
  initialLga?: string;
  initialAddressData?: Partial<DetailedAddressData>;
}

export default function AddressInput({ onAddressChange, initialState = 'plateau', initialLga, initialAddressData }: AddressInputProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<EnhancedAddressData[]>([]);
  const [loading, setLoading] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [detailedMode, setDetailedMode] = useState(false);
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });
  const suggestionRef = useRef<HTMLDivElement>(null);

  // Detailed address form fields
  const [houseNumber, setHouseNumber] = useState('');
  const [streetName, setStreetName] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [landmark, setLandmark] = useState('');
  const [area, setArea] = useState('');
  const [state, setState] = useState(initialState);
  const [lga, setLga] = useState(initialLga || STATES[initialState as keyof typeof STATES]?.lgas[0] || '');

  const stateLgas = STATES[state as keyof typeof STATES]?.lgas || [];

  useEffect(() => {
    if (!initialAddressData?.fullAddress) return;
    if (searchQuery) return;

    const nextState = initialAddressData.state || initialState;
    const nextLga = initialAddressData.lga || initialLga || STATES[nextState as keyof typeof STATES]?.lgas[0] || '';

    setHouseNumber(initialAddressData.houseNumber || '');
    setStreetName(initialAddressData.streetName || '');
    setBuildingName(initialAddressData.buildingName || '');
    setLandmark(initialAddressData.landmark || '');
    setArea(initialAddressData.area || '');
    setState(nextState);
    setLga(nextLga);
    setSearchQuery(initialAddressData.fullAddress);
    setCoordinates({ lat: initialAddressData.lat || 0, lng: initialAddressData.lng || 0 });
    setDetailedMode(true);

    onAddressChange({
      houseNumber: initialAddressData.houseNumber || '',
      streetName: initialAddressData.streetName || '',
      buildingName: initialAddressData.buildingName || '',
      landmark: initialAddressData.landmark || '',
      area: initialAddressData.area || '',
      state: nextState,
      lga: nextLga,
      fullAddress: initialAddressData.fullAddress,
      lat: initialAddressData.lat,
      lng: initialAddressData.lng,
    });
  }, [initialAddressData, searchQuery, initialState, initialLga, onAddressChange]);

  // Search for addresses
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 3) {
        searchAddresses(searchQuery);
      } else {
        setSuggestions([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchAddresses = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    try {
      const results = await searchLocationsWithCoverage(query);
      setSuggestions(results);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Location search error:', error);
      toast.error('Failed to search addresses');
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSuggestion = async (suggestion: EnhancedAddressData) => {
    try {
      // Extract address components from the enhanced data
      setHouseNumber(suggestion.components.houseNumber || '');
      setStreetName(suggestion.components.streetName || '');
      setBuildingName('');
      setArea(suggestion.components.area || '');
      setState(suggestion.components.state || '');
      setLga(suggestion.components.lga || '');
      setSearchQuery(suggestion.displayName);
      setShowSuggestions(false);
      setDetailedMode(true);

      // Notify parent with the enhanced address data
      onAddressChange({
        houseNumber: suggestion.components.houseNumber || '',
        streetName: suggestion.components.streetName || '',
        buildingName: '',
        landmark: suggestion.components.landmark || '',
        state: suggestion.components.state || '',
        lga: suggestion.components.lga || '',
        area: suggestion.components.area || '',
        fullAddress: suggestion.displayName,
        lat: suggestion.latitude,
        lng: suggestion.longitude,
      });

      setCoordinates({ lat: suggestion.latitude, lng: suggestion.longitude });

      // Show delivery availability status
      if (suggestion.deliveryCoverage.isSupported) {
        toast.success('Address selected! Delivery available in this area.');
      } else {
        toast.error('Address selected, but delivery may not be available in this area.');
      }
    } catch (error) {
      console.error('❌ Error selecting address:', error);
      toast.error('Failed to select address');
    }
  };

  const handleUseCurrentLocation = async () => {
    setLocatingUser(true);
    try {
      const locationData = await getCurrentLocationEnhanced();

      setHouseNumber(locationData.components.houseNumber || '');
      setStreetName(locationData.components.streetName || '');
      setBuildingName('');
      setLandmark(locationData.components.landmark || '');
      setArea(locationData.components.area || '');
      setState(locationData.components.state || '');
      setLga(locationData.components.lga || '');
      setSearchQuery(locationData.displayName);
      setDetailedMode(true);
      setShowSuggestions(false);

      onAddressChange({
        houseNumber: locationData.components.houseNumber || '',
        streetName: locationData.components.streetName || '',
        buildingName: '',
        landmark: locationData.components.landmark || '',
        area: locationData.components.area || '',
        state: locationData.components.state || '',
        lga: locationData.components.lga || '',
        fullAddress: locationData.displayName,
        lat: locationData.latitude,
        lng: locationData.longitude,
      });
      setCoordinates({ lat: locationData.latitude, lng: locationData.longitude });

      if (locationData.deliveryCoverage.isSupported) {
        toast.success('Location detected! Delivery available in this area.');
      } else {
        toast.error('Location detected, but delivery may not be available in this area.');
      }
    } catch (error) {
      console.error('❌ Location error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to get location');
    } finally {
      setLocatingUser(false);
    }
  };

  const handleAddressUpdate = () => {
    const addressParts = [houseNumber, streetName, buildingName, area].filter(Boolean);
    const fullAddress = addressParts.join(', ') || searchQuery;

    onAddressChange({
      houseNumber,
      streetName,
      buildingName,
      landmark,
      area,
      state,
      lga,
      fullAddress,
      lat: coordinates.lat,
      lng: coordinates.lng,
    });

    toast.success('Address updated!');
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-orange-500" />
        Delivery Address
      </h2>

      <div className="space-y-4">
        {/* Search/Location Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Location or Use Current Location
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative" ref={suggestionRef}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery && setShowSuggestions(true)}
                placeholder="Search address (e.g., Ahmadu Bello Way, Jos)"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              {loading && <Loader className="w-5 h-5 text-orange-500 animate-spin absolute right-3 top-3" />}

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl mt-1 shadow-lg z-20 max-h-60 overflow-y-auto">
                  {suggestions.map((sugg, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectSuggestion(sugg)}
                      className="w-full text-left px-4 py-3 hover:bg-orange-50 border-b last:border-b-0 transition flex items-start gap-2"
                    >
                      <MapPin className="w-4 h-4 text-orange-500 mt-1 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{sugg.displayName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            sugg.deliveryCoverage.isSupported
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {sugg.deliveryCoverage.isSupported ? '✓ Delivery Available' : '⚠ Limited Delivery'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {sugg.components.state}, {sugg.components.lga}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-1">
                          Lat: {sugg.latitude.toFixed(4)}, Lng: {sugg.longitude.toFixed(4)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {showSuggestions && searchQuery && !loading && suggestions.length === 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl mt-1 shadow-lg z-20 p-4 text-center">
                  <p className="text-gray-500 text-sm">No addresses found. Try a different search.</p>
                </div>
              )}
            </div>

            <button
              onClick={handleUseCurrentLocation}
              disabled={locatingUser}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-4 py-3 rounded-xl font-medium transition flex items-center gap-2 whitespace-nowrap"
            >
              {locatingUser ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Locating...
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4" />
                  Use My Location
                </>
              )}
            </button>
          </div>
        </div>

        {/* Detailed Address Form */}
        {detailedMode && (
          <div className="border-t pt-4 space-y-4 bg-orange-50 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-sm text-orange-700 mb-3">
              <AlertCircle className="w-4 h-4" />
              <span>Please fill in or verify the address details below</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">House/Apt Number</label>
                <input
                  type="text"
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  placeholder="e.g., 10"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Name</label>
                <input
                  type="text"
                  value={streetName}
                  onChange={(e) => setStreetName(e.target.value)}
                  placeholder="e.g., Ahmadu Bello Way"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Building Name (Optional)</label>
                <input
                  type="text"
                  value={buildingName}
                  onChange={(e) => setBuildingName(e.target.value)}
                  placeholder="e.g., Providence Tower"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Landmark (Optional)</label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g., Near the market"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Area/District (Optional)</label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g., GRA, Sabon Gida"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <select
                  value={state}
                  onChange={(e) => {
                    setState(e.target.value);
                    setLga(STATES[e.target.value as keyof typeof STATES]?.lgas[0] || '');
                  }}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                >
                  {Object.entries(STATES).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LGA</label>
                <select
                  value={lga}
                  onChange={(e) => setLga(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                >
                  <option value="">Select LGA...</option>
                  {stateLgas.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleAddressUpdate}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-xl font-medium transition flex items-center justify-center gap-2 text-sm"
            >
              <Check className="w-4 h-4" />
              Confirm Address
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
