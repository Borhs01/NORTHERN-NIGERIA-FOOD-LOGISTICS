import { useEffect, useRef, useState } from 'react';
import { MapPin, Search, ChevronDown, Loader2, ShoppingCart } from 'lucide-react';
import { locationApi } from '../../services/api';
import ProfileDropdown from '../shared/ProfileDropdown';
import type { LocationData } from '../../hooks/useGeolocation';

interface LocationSuggestion {
  placeId: string;
  displayName: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
  components?: Record<string, string>;
}

interface NavbarProps {
  user: {
    name?: string;
    role?: string;
    email?: string;
    phone?: string;
  } | null;
  search: string;
  setSearch: (value: string) => void;
  cartCount: number;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  onRefreshLocation: () => void;
  onManualLocationSelect: (location: LocationData) => void;
}

export default function Navbar({
  user,
  search,
  setSearch,
  cartCount,
  onNavigate,
  onLogout,
  location,
  loading,
  error,
  onRefreshLocation,
  onManualLocationSelect,
}: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
        setManualOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = async (value: string) => {
    setQuery(value);
    if (value.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    try {
      const response = await locationApi.searchLocations(value, 6);
      setSuggestions(response.data || []);
    } catch {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectSuggestion = (item: LocationSuggestion) => {
    const components = item.components || {};
    const rawState = (components.state || '').toLowerCase();
    const normalizedState = rawState.includes('plateau')
      ? 'plateau'
      : rawState.includes('bauchi')
        ? 'bauchi'
        : rawState.includes('kaduna')
          ? 'kaduna'
        : undefined;
    const selectedLocation: LocationData = {
      lat: item.latitude,
      lng: item.longitude,
      address: item.fullAddress || item.displayName || '',
      updatedAt: new Date().toISOString(),
      state: normalizedState,
      lga: components.area || components.city || components.town || '',
      components,
    };
    onManualLocationSelect(selectedLocation);
    setQuery('');
    setSuggestions([]);
    setDropdownOpen(false);
    setManualOpen(false);
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4 h-16">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <span className="heading-font text-xl font-bold text-gray-900 hidden sm:block">NorthEats</span>
        </div>

        <div className="relative flex-1 max-w-3xl mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            aria-label="Search restaurants or dishes"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
            placeholder="Search restaurants or dishes..."
          />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:shadow-sm transition"
              type="button"
            >
              <MapPin className="w-4 h-4 text-orange-500" />
              <span className="max-w-40 truncate">{location?.address || 'Set location'}</span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-3xl border border-gray-200 shadow-xl z-40 overflow-hidden">
                <div className="p-4 space-y-3">
                  <button
                    onClick={() => { onRefreshLocation(); setDropdownOpen(false); }}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-2 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                    type="button"
                  >
                    {loading ? 'Detecting location...' : 'Use current location'}
                  </button>
                  <button
                    onClick={() => setManualOpen((prev) => !prev)}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-2 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                    type="button"
                  >
                    Enter address manually
                  </button>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                </div>

                {manualOpen && (
                  <div className="border-t border-gray-100 p-4">
                    <label className="text-xs font-semibold uppercase text-gray-500">Search address</label>
                    <div className="mt-2 relative">
                      <input
                        value={query}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder="Type your address..."
                        className="w-full rounded-2xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-orange-400"
                      />
                      {searching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      )}
                    </div>
                    {suggestions.length > 0 && (
                      <div className="mt-3 max-h-64 overflow-y-auto rounded-3xl border border-gray-200 bg-white shadow-sm">
                        {suggestions.map((item) => (
                          <button
                            key={item.placeId}
                            onClick={() => handleSelectSuggestion(item)}
                            className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
                            type="button"
                          >
                            <p className="font-semibold truncate">{item.displayName}</p>
                            <p className="text-xs text-gray-500 truncate">{item.fullAddress || item.displayName}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <button onClick={() => onNavigate('/checkout')} className="relative p-2 text-gray-600 hover:text-orange-500 transition" type="button" title="Shopping Cart">
            <span className="sr-only">Shopping cart</span>
            <div className="relative">
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 gradient-primary text-white text-xs font-bold rounded-full flex items-center justify-center">{cartCount}</span>
              )}
            </div>
          </button>

          <ProfileDropdown user={user} onNavigate={onNavigate} onLogout={onLogout} />
        </div>
      </div>
    </nav>
  );
}
