import { useEffect, useRef, useState } from 'react';
import { MapPin, Loader } from 'lucide-react';

interface AddressInputDarkProps {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
  label?: string;
}

interface AddressSuggestion {
  displayName: string;
  lat: string | number;
  lon: string | number;
  address: {
    house_number?: string;
    road?: string;
    building?: string;
    hamlet?: string;
    village?: string;
    town?: string;
    city?: string;
    county?: string;
  };
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    house_number?: string;
    road?: string;
    building?: string;
    hamlet?: string;
    village?: string;
    town?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
  };
}

export default function AddressInputDark({ value, onChange, placeholder, label }: AddressInputDarkProps) {
  const [searchQuery, setSearchQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

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
    setLoading(true);
    try {
      console.log('🔍 Searching for:', query);
      
      // Try primary search: Location + Nigeria with better parameters
      const searchUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=ng&format=json&addressdetails=1&limit=15`;

      const response = await fetch(searchUrl, {
        headers: { 'Accept-Language': 'en' },
      });

      if (!response.ok) {
        throw new Error('Address search failed');
      }

      let results = await response.json();
      
      // If few results, try a secondary search with Plateau context
      if (results.length < 5) {
        console.log('⚠️ Limited results, trying broader search...');
        const fallbackUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}, Plateau, Nigeria&format=json&addressdetails=1&limit=15`;
        const fallbackResponse = await fetch(fallbackUrl, {
          headers: { 'Accept-Language': 'en' },
        });
        if (fallbackResponse.ok) {
          const fallbackResults = await fallbackResponse.json();
          results = [...results, ...fallbackResults].slice(0, 15);
        }
      }

      // Map Nominatim response to our AddressSuggestion interface
      const mappedResults = results.map((result: NominatimResult) => ({
        displayName: result.display_name,
        lat: result.lat,
        lon: result.lon,
        address: result.address,
      }));
      
      setSuggestions(mappedResults);
      setShowSuggestions(true);
      console.log('✅ Found suggestions:', mappedResults.length);
    } catch (error) {
      console.error('❌ Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    setSearchQuery(suggestion.displayName);
    onChange(suggestion.displayName);
    setShowSuggestions(false);
  };

  return (
    <div>
      {label && <label className="block text-gray-300 text-sm mb-1">{label}</label>}
      <div ref={suggestionRef} className="relative">
        <div className="relative flex items-center">
          <div className="absolute left-3 pointer-events-none text-gray-400">
            <MapPin className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery && setSuggestions.length > 0 && setShowSuggestions(true)}
            className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-500 rounded-xl px-4 py-3 pl-10 focus:outline-none focus:border-orange-400 transition"
            placeholder={placeholder || 'Search address...'}
          />
          {loading && <Loader className="w-4 h-4 text-orange-400 animate-spin absolute right-3" />}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-gray-900 border border-white/10 rounded-xl mt-1 shadow-2xl z-20 max-h-60 overflow-y-auto">
            {suggestions.map((sugg, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSuggestion(sugg)}
                className="w-full text-left px-4 py-3 hover:bg-white/5 border-b border-white/5 last:border-b-0 transition flex items-start gap-2"
              >
                <MapPin className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-white truncate">{sugg.displayName}</p>
                  <p className="text-xs text-gray-400 truncate">
                    Coordinates: {Number(sugg.lat).toFixed(4)}, {Number(sugg.lon).toFixed(4)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {showSuggestions && searchQuery && !loading && suggestions.length === 0 && (
          <div className="absolute top-full left-0 right-0 bg-gray-900 border border-white/10 rounded-xl mt-1 shadow-2xl z-20 p-4 text-center">
            <p className="text-gray-400 text-sm">No addresses found. Try another location.</p>
          </div>
        )}
      </div>
    </div>
  );
}
