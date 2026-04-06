import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Star, Clock, MapPin, Plus, Minus, ShoppingCart, X, ChefHat } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { useCartStore } from '../../../store/cartStore';
import { formatNGN } from '../../../utils/constants';
import { Spinner } from '../../../components/shared';

interface FoodItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isAvailable: boolean;
  isPopular: boolean;
}

interface Vendor {
  _id: string;
  businessName: string;
  logo: string;
  coverImage: string;
  description: string;
  lga: string;
  state: string;
  averageRating: number;
  totalOrders: number;
  deliveryFee: number;
  estimatedDeliveryTime: string;
  openingHours: string;
  isOpen: boolean;
  phone: string;
}

export default function VendorMenuPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items: cartItems, addItem, removeItem, updateQty, total, vendorId, deliveryFee } = useCartStore();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [menuItems, setMenuItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [showCart, setShowCart] = useState(false);

  const cartCount = cartItems.reduce((acc, i) => acc + i.qty, 0);
  const cartTotal = total();

  useEffect(() => {
    fetchVendor();
  }, [id]);

  const fetchVendor = async () => {
    try {
      const { data } = await api.get(`/vendors/${id}`);
      setVendor(data.vendor);
      setMenuItems(data.items);
      if (data.vendor.deliveryFee) useCartStore.getState().setDeliveryFee(data.vendor.deliveryFee);
    } catch {
      toast.error('Vendor not found');
      navigate('/home');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...Array.from(new Set(menuItems.map((i) => i.category)))];
  const filtered = activeCategory === 'All' ? menuItems : menuItems.filter((i) => i.category === activeCategory);

  const getQty = (itemId: string) => cartItems.find((i) => i._id === itemId)?.qty || 0;

  const handleAdd = (item: FoodItem) => {
    if (!vendor) return;
    if (vendorId && vendorId !== vendor._id) {
      toast((t) => (
        <div>
          <p className="font-semibold text-sm mb-2">Replace cart?</p>
          <p className="text-gray-500 text-xs mb-3">Your cart has items from another restaurant. Add this item to start a new cart.</p>
          <div className="flex gap-2">
            <button onClick={() => { addItem({ _id: item._id, name: item.name, price: item.price, image: item.image, qty: 1, vendorId: vendor._id }, vendor._id, vendor.businessName); toast.dismiss(t.id); }}
              className="flex-1 gradient-primary text-white py-1.5 rounded-lg text-xs font-semibold">Replace</button>
            <button onClick={() => toast.dismiss(t.id)} className="flex-1 border py-1.5 rounded-lg text-xs">Cancel</button>
          </div>
        </div>
      ), { duration: 6000 });
      return;
    }
    addItem({ _id: item._id, name: item.name, price: item.price, image: item.image, qty: 1, vendorId: vendor._id }, vendor._id, vendor.businessName);
    toast.success(`${item.name} added!`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  if (!vendor) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />

      {/* COVER */}
      <div className="relative h-56 md:h-72">
        <img src={vendor.coverImage || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80'}
          alt={vendor.businessName} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent" />
        <button onClick={() => navigate('/home')} className="absolute top-4 left-4 glass p-2 rounded-xl text-white hover:bg-white/20 transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        {cartCount > 0 && (
          <button onClick={() => setShowCart(true)} className="absolute top-4 right-4 glass p-2 rounded-xl text-white hover:bg-white/20 transition">
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 gradient-primary text-white text-xs rounded-full flex items-center justify-center font-bold">{cartCount}</span>
            </div>
          </button>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 flex items-end gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white shadow-lg shrink-0">
            {vendor.logo ? <img src={vendor.logo} alt="" className="w-full h-full object-cover" /> : (
              <div className="w-full h-full gradient-primary flex items-center justify-center"><ChefHat className="w-8 h-8 text-white" /></div>
            )}
          </div>
          <div>
            <h1 className="text-white text-2xl font-bold">{vendor.businessName}</h1>
            <div className="flex items-center gap-4 text-gray-300 text-sm mt-1">
              <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" /> {vendor.averageRating || '4.5'}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {vendor.estimatedDeliveryTime}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {vendor.lga}</span>
            </div>
          </div>
        </div>
      </div>

      {/* INFO BAR */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-6 text-sm text-gray-600 overflow-x-auto">
          <span>Delivery: <strong className="text-orange-500">{formatNGN(vendor.deliveryFee)}</strong></span>
          <span>Hours: <strong>{vendor.openingHours}</strong></span>
          <span>{vendor.totalOrders?.toLocaleString()} orders</span>
          <span className={`font-semibold ${vendor.isOpen ? 'text-green-600' : 'text-red-500'}`}>{vendor.isOpen ? '● Open Now' : '● Closed'}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* CATEGORY TABS */}
        <div className="flex gap-3 overflow-x-auto pb-2 mb-8 sticky top-16 bg-gray-50 py-3 z-10">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${activeCategory === cat ? 'gradient-primary text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300'}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* MENU GRID */}
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((item, i) => (
            <motion.div key={item._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition ${!item.isAvailable ? 'opacity-60' : ''}`}>
              <div className="flex gap-3 p-4">
                <div className="flex-1">
                  <div className="flex items-start gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      {item.isPopular && (
                        <span className="text-xs bg-orange-100 text-orange-600 font-semibold px-2 py-0.5 rounded-full">Popular</span>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm mt-1 line-clamp-2">{item.description}</p>
                  <p className="text-orange-500 font-bold text-lg mt-2">{formatNGN(item.price)}</p>
                </div>
                <div className="shrink-0 flex flex-col items-center gap-2">
                  {item.image && (
                    <img src={item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover" />
                  )}
                  {item.isAvailable && (
                    <div className="flex items-center gap-2">
                      {getQty(item._id) > 0 ? (
                        <div className="flex items-center gap-2 gradient-primary rounded-full px-2 py-1">
                          <button onClick={() => updateQty(item._id, getQty(item._id) - 1)} className="text-white hover:opacity-70"><Minus className="w-3.5 h-3.5" /></button>
                          <span className="text-white font-bold text-sm">{getQty(item._id)}</span>
                          <button onClick={() => handleAdd(item)} className="text-white hover:opacity-70"><Plus className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <button onClick={() => handleAdd(item)} className="gradient-primary text-white p-2 rounded-full hover:opacity-90 transition shadow-md">
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CART BUTTON (floating) */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
          <button onClick={() => navigate('/checkout')} className="gradient-primary text-white px-8 py-4 rounded-2xl font-semibold shadow-2xl shadow-orange-500/40 hover:opacity-90 transition flex items-center gap-3">
            <ShoppingCart className="w-5 h-5" />
            <span>{cartCount} item{cartCount > 1 ? 's' : ''} · {formatNGN(cartTotal)}</span>
            <span>→ Checkout</span>
          </button>
        </div>
      )}

      {/* CART DRAWER */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowCart(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white z-50 shadow-2xl overflow-y-auto">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="font-bold text-lg">Your Cart</h2>
                <button onClick={() => setShowCart(false)}><X className="w-5 h-5" /></button>
              </div>
              <div className="p-4 space-y-3">
                {cartItems.map((item) => (
                  <div key={item._id} className="flex items-center gap-3">
                    {item.image && <img src={item.image} alt="" className="w-12 h-12 rounded-xl object-cover" />}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-orange-500 font-bold text-sm">{formatNGN(item.price * item.qty)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(item._id, item.qty - 1)} className="w-7 h-7 gradient-primary text-white rounded-full flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                      <span className="font-bold text-sm w-4 text-center">{item.qty}</span>
                      <button onClick={() => updateQty(item._id, item.qty + 1)} className="w-7 h-7 gradient-primary text-white rounded-full flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                    </div>
                    <button onClick={() => removeItem(item._id)} className="text-gray-300 hover:text-red-500 transition"><X className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="font-medium">{formatNGN(cartTotal)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Delivery</span><span className="font-medium">{formatNGN(deliveryFee)}</span></div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total</span><span className="text-orange-500">{formatNGN(cartTotal + deliveryFee)}</span></div>
                </div>
                <button onClick={() => { setShowCart(false); navigate('/checkout'); }} className="w-full gradient-primary text-white py-3.5 rounded-xl font-semibold hover:opacity-90 transition">
                  Proceed to Checkout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
