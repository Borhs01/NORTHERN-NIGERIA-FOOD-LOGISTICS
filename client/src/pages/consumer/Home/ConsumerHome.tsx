import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, ShoppingCart, Star, Clock, ChefHat, LogOut, User, ChevronDown, SlidersHorizontal, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { useAuthStore } from '../../../store/authStore';
import { useCartStore } from '../../../store/cartStore';
import { STATES, FOOD_CATEGORIES } from '../../../utils/constants';
import { SkeletonCard } from '../../../components/shared';

interface Vendor {
  _id: string;
  businessName: string;
  logo: string;
  coverImage: string;
  state: string;
  lga: string;
  averageRating: number;
  totalOrders: number;
  deliveryFee: number;
  estimatedDeliveryTime: string;
  isOpen: boolean;
  categories: string[];
}

export default function ConsumerHome() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { items: cartItems } = useCartStore();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState(user?.state || 'plateau');
  const [selectedLga, setSelectedLga] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showStateMenu, setShowStateMenu] = useState(false);
  const cartCount = cartItems.reduce((acc, i) => acc + i.qty, 0);

  useEffect(() => {
    fetchVendors();
  }, [selectedState, selectedLga, selectedCategory]);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { state: selectedState };
      if (selectedLga) params.lga = selectedLga;
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (search) params.search = search;
      const { data } = await api.get('/vendors', { params });
      setVendors(data.vendors);
    } catch {
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await api.post('/auth/logout');
    logout();
    navigate('/');
  };

  const stateLgas = STATES[selectedState as keyof typeof STATES]?.lgas || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />

      {/* NAVBAR */}
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4 h-16">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <span className="heading-font text-xl font-bold text-gray-900 hidden sm:block">NorthEats</span>
          </div>

          <div className="relative flex-1 max-w-lg mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchVendors()}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
              placeholder="Search restaurants or dishes..." />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button onClick={() => navigate('/checkout')} className="relative p-2 text-gray-600 hover:text-orange-500 transition" title="Shopping Cart">
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 gradient-primary text-white text-xs font-bold rounded-full flex items-center justify-center">{cartCount}</span>
              )}
            </button>
            <button onClick={() => navigate('/orders')} className="p-2 text-gray-600 hover:text-orange-500 transition" title="My Orders">
              <Package className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700">{user?.name?.split(' ')[0]}</span>
            </div>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </nav>

      {/* HERO BANNER */}
      <div className="gradient-hero py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-orange-400" />
            <div className="relative">
              <button onClick={() => setShowStateMenu(!showStateMenu)}
                className="flex items-center gap-1 text-white font-semibold text-lg hover:text-orange-300 transition">
                {STATES[selectedState as keyof typeof STATES]?.label}
                <ChevronDown className="w-4 h-4" />
              </button>
              {showStateMenu && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20 min-w-48">
                  {Object.entries(STATES).map(([key, val]) => (
                    <button key={key} onClick={() => { setSelectedState(key); setSelectedLga(''); setShowStateMenu(false); }}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-orange-50 transition ${selectedState === key ? 'text-orange-500 font-semibold bg-orange-50' : 'text-gray-700'}`}>
                      {val.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <h1 className="heading-font text-2xl md:text-3xl font-bold text-white mb-2">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-300">What would you like to eat today?</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* FILTERS */}
        <div className="flex items-center gap-4 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex items-center gap-2 shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-gray-400" />
            <select value={selectedLga} onChange={(e) => setSelectedLga(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white">
              <option value="">All LGAs</option>
              {stateLgas.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          {FOOD_CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${selectedCategory === cat ? 'gradient-primary text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300'}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* POPULAR NOW */}
        {!loading && vendors.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Popular Right Now 🔥</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {vendors.slice(0, 5).map((v) => (
                <div key={v._id} onClick={() => navigate(`/vendor/${v._id}`)}
                  className="shrink-0 w-52 bg-white rounded-2xl overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition">
                  <img src={v.coverImage || `https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&q=70`}
                    alt={v.businessName} className="w-full h-28 object-cover" />
                  <div className="p-3">
                    <p className="font-semibold text-sm text-gray-900 truncate">{v.businessName}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs text-gray-500">{v.averageRating || '4.5'}</span>
                      <span className="text-xs text-gray-300 ml-1">·</span>
                      <Clock className="w-3 h-3 text-gray-400 ml-1" />
                      <span className="text-xs text-gray-500">{v.estimatedDeliveryTime}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VENDOR GRID */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">All Restaurants</h2>
          <span className="text-gray-400 text-sm">{vendors.length} found</span>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-20">
            <ChefHat className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">No restaurants found</p>
            <p className="text-gray-400 text-sm mt-1">Try changing your filters or location</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {vendors.map((v, i) => (
              <motion.div key={v._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/vendor/${v._id}`)}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition cursor-pointer group">
                <div className="relative overflow-hidden">
                  <img src={v.coverImage || `https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=70`}
                    alt={v.businessName} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-400" />
                  {!v.isOpen && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-black/70 text-white px-3 py-1.5 rounded-full text-sm font-semibold">Closed</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 w-10 h-10 rounded-xl overflow-hidden bg-white shadow-md">
                    {v.logo ? (
                      <img src={v.logo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full gradient-primary flex items-center justify-center">
                        <ChefHat className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-bold text-gray-800">{v.averageRating || '4.5'}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-1 truncate">{v.businessName}</h3>
                  <div className="flex items-center text-sm text-gray-500 gap-3">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {v.lga}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {v.estimatedDeliveryTime}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-400">Delivery: <strong className="text-orange-500">₦{v.deliveryFee?.toLocaleString()}</strong></span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${v.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {v.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
