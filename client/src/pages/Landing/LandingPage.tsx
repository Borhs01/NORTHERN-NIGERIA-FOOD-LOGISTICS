import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  MapPin, Star, Clock, Truck, Shield, ChevronRight, Phone, Mail,
  ChefHat, Package, TrendingUp, ArrowRight, CheckCircle,
  Bike, Store, Menu, X, Instagram, Twitter, Facebook
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { ProfileDropdown } from '../../components/shared';

const HERO_FOODS = [
  { name: 'Suya Special', price: '₦2,500', img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80', rating: 4.9 },
  { name: 'Jollof Rice', price: '₦1,800', img: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80', rating: 4.8 },
  { name: 'Grilled Chicken', price: '₦3,200', img: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400&q=80', rating: 4.7 },
];

const CITIES = [
  { name: 'Jos, Plateau', img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80', vendors: '120+', specialty: 'Suya & Miyan Kuka' },
  { name: 'Bauchi', img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80', vendors: '80+', specialty: 'Kilishi & Rice' },
  { name: 'Kaduna', img: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&q=80', vendors: '150+', specialty: 'Fast Food & Grills' },
];

const CATEGORIES = [
  { icon: '🍚', name: 'Rice Dishes' }, { icon: '🥘', name: 'Soups' },
  { icon: '🍢', name: 'Suya & Grills' }, { icon: '🍞', name: 'Snacks' },
  { icon: '🥤', name: 'Drinks' }, { icon: '🍗', name: 'Chicken' },
  { icon: '🥩', name: 'Kilishi' }, { icon: '🌮', name: 'Fast Food' },
];

const TOP_VENDORS = [
  { name: 'Mama Ngozi Kitchen', rating: 4.9, reviews: 320, time: '25 min', city: 'Jos', img: 'https://images.unsplash.com/photo-1590846406792-0adc7f938f1d?w=400&q=80' },
  { name: 'Alhaji Suya Spot', rating: 4.8, reviews: 218, time: '20 min', city: 'Bauchi', img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80' },
  { name: 'Northern Delights', rating: 4.7, reviews: 195, time: '30 min', city: 'Kaduna', img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80' },
  { name: 'Plateau Palace', rating: 4.9, reviews: 410, time: '22 min', city: 'Jos', img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80' },
];

const FEATURES = [
  { icon: <Truck className="w-8 h-8" />, title: 'Lightning Fast Delivery', desc: 'Get your food delivered in 30 minutes or less, tracked live on the map.' },
  { icon: <Shield className="w-8 h-8" />, title: 'Secure Payments', desc: 'Powered by Paystack — Nigeria\'s most trusted payment gateway.' },
  { icon: <Star className="w-8 h-8" />, title: 'Quality Guaranteed', desc: 'Every vendor is verified and rated by real customers like you.' },
  { icon: <ChefHat className="w-8 h-8" />, title: 'Local Flavors', desc: 'Authentic Northern Nigerian cuisine from your favourite local spots.' },
];

const TESTIMONIALS = [
  { name: 'Aisha Musa', city: 'Jos', text: 'NorthEats has completely changed how I eat. The suya arrives hot and fresh every time!', rating: 5, img: 'https://i.pravatar.cc/60?img=5' },
  { name: 'Ibrahim Yusuf', city: 'Kaduna', text: 'Best food delivery app in the North. Fast, reliable and the app is beautiful.', rating: 5, img: 'https://i.pravatar.cc/60?img=11' },
  { name: 'Fatima Bello', city: 'Bauchi', text: 'I love how easy it is to find local food. The kilishi section is my favourite!', rating: 5, img: 'https://i.pravatar.cc/60?img=9' },
  { name: 'Chukwuemeka Eze', city: 'Jos', text: 'Moved here recently and NorthEats helped me discover amazing local restaurants.', rating: 5, img: 'https://i.pravatar.cc/60?img=15' },
];

const STATS = [
  { value: 350, suffix: '+', label: 'Restaurants' },
  { value: 50000, suffix: '+', label: 'Orders Delivered' },
  { value: 3, suffix: ' States', label: 'Coverage' },
  { value: 98, suffix: '%', label: 'Happy Customers' },
];

function AnimatedCounter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const end = target;
    const duration = 2000;
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const handleLogout = async () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    const t = setInterval(() => setCurrentTestimonial((p) => (p + 1) % TESTIMONIALS.length), 4000);
    return () => clearInterval(t);
  }, []);

  const [backgroundDots] = useState(() => 
    [...Array(20)].map(() => ({
      width: Math.random() * 100 + 20,
      height: Math.random() * 100 + 20,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      opacity: Math.random() * 0.5
    }))
  );

  const handleGetStarted = () => {
    if (user) {
      if (user.role === 'consumer') navigate('/home');
      else if (user.role === 'vendor') navigate('/vendor/dashboard');
      else if (user.role === 'rider') navigate('/rider/dashboard');
      else if (user.role === 'admin') navigate('/admin');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;700;800&display=swap" rel="stylesheet" />

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 glass-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <span className="heading-font text-xl font-bold text-white">NorthEats</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {['Features', 'Cities', 'Vendors', 'Riders'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-gray-300 hover:text-orange-400 transition text-sm font-medium">{item}</a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <ProfileDropdown
                user={user}
                onNavigate={(path) => navigate(path)}
                onLogout={handleLogout}
                supportEmail="support@northeats.com"
                supportPhone="+234 800 000 0000"
                compact
              />
            ) : (
              <button onClick={() => navigate('/auth')} className="text-gray-300 hover:text-white text-sm font-medium transition">Login</button>
            )}
            <button onClick={handleGetStarted} className="gradient-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition">
              Order Now
            </button>
          </div>

          <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden glass-dark border-t border-white/10 px-4 py-4 space-y-3">
            {['Features', 'Cities', 'Vendors', 'Riders'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="block text-gray-300 hover:text-orange-400 py-1 text-sm">{item}</a>
            ))}
            {user ? (
              <>
                <button onClick={() => navigate(user?.role === 'consumer' ? '/home' : user?.role === 'vendor' ? '/vendor/dashboard' : user?.role === 'rider' ? '/rider/dashboard' : '/admin')}
                  className="w-full text-left px-4 py-3 rounded-xl border border-white/20 text-gray-200 font-medium hover:bg-white/10 transition">
                  Continue as {user.name.split(' ')[0]}
                </button>
                <button onClick={handleLogout} className="w-full text-left px-4 py-3 rounded-xl border border-white/20 text-red-400 font-medium hover:bg-white/10 transition">
                  Logout
                </button>
              </>
            ) : (
              <button onClick={() => navigate('/auth')} className="w-full text-left px-4 py-3 rounded-xl border border-white/20 text-gray-200 font-medium hover:bg-white/10 transition">
                Login
              </button>
            )}
            <button onClick={handleGetStarted} className="w-full gradient-primary text-white py-2 rounded-xl text-sm font-semibold mt-2">
              Order Now
            </button>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="gradient-hero min-h-screen flex items-center pt-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {backgroundDots.map((style, i) => (
            <div key={i} className="absolute rounded-full bg-orange-500" style={style} />
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-1.5 mb-6">
              <MapPin className="w-4 h-4 text-orange-400" />
              <span className="text-orange-300 text-sm font-medium">Plateau • Bauchi • Kaduna</span>
            </div>
            <h1 className="heading-font text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Fresh from the <span className="text-gradient">North</span>,<br />Delivered to Your Door
            </h1>
            <p className="text-gray-300 text-lg md:text-xl mb-8 max-w-lg">
              Order your favourite local meals from trusted vendors across Northern Nigeria. Fast delivery, secure payment, real-time tracking.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={handleGetStarted} className="gradient-primary text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:opacity-90 transition flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30">
                Order Now <ArrowRight className="w-5 h-5" />
              </button>
              <button onClick={() => navigate('/auth?mode=vendor')} className="glass border border-white/20 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white/10 transition flex items-center justify-center gap-2">
                Become a Vendor <Store className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-6 mt-10">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <img key={i} src={`https://i.pravatar.cc/36?img=${i * 3}`} className="w-9 h-9 rounded-full border-2 border-white object-cover" alt="" />
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-gray-400 text-sm">50,000+ happy customers</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="hidden lg:block">
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                {HERO_FOODS.map((food, i) => (
                  <motion.div key={food.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.15 }}
                    className={`glass rounded-2xl overflow-hidden ${i === 0 ? 'col-span-2' : ''}`}>
                    <img src={food.img} alt={food.name} className={`w-full object-cover ${i === 0 ? 'h-48' : 'h-36'}`} />
                    <div className="p-3 flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold text-sm">{food.name}</p>
                        <p className="text-orange-400 font-bold text-sm">{food.price}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-white text-xs">{food.rating}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="absolute -bottom-4 -right-4 glass rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white text-xs font-semibold">Order Delivered!</p>
                  <p className="text-gray-400 text-xs">28 minutes</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="heading-font text-3xl md:text-4xl font-bold text-gray-900 mb-4">How NorthEats Works</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">Ordering your favourite local food has never been this simple</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: <MapPin className="w-8 h-8" />, title: 'Choose Your City', desc: 'Select your state — Plateau, Bauchi or Kaduna — and browse nearby restaurants.' },
              { step: '02', icon: <Package className="w-8 h-8" />, title: 'Place Your Order', desc: 'Pick your favourite meals, add to cart, and pay securely with Paystack.' },
              { step: '03', icon: <Truck className="w-8 h-8" />, title: 'Track & Receive', desc: 'Watch your rider on the map and get your food delivered fresh to your door.' },
            ].map((item, i) => (
              <motion.div key={item.step} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }} viewport={{ once: true }}
                className="text-center group">
                <div className="relative inline-block mb-6">
                  <div className="w-20 h-20 gradient-primary rounded-3xl flex items-center justify-center text-white shadow-lg shadow-orange-200 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-gray-900 text-white text-xs font-bold rounded-full flex items-center justify-center">{item.step}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-500">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED CITIES */}
      <section id="cities" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="heading-font text-3xl md:text-4xl font-bold text-gray-900 mb-4">We Deliver Across 3 States</h2>
            <p className="text-gray-500 text-lg">Serving the best of Northern Nigerian cuisine in every city</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {CITIES.map((city, i) => (
              <motion.div key={city.name} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className="relative rounded-3xl overflow-hidden group cursor-pointer shadow-xl" onClick={handleGetStarted}>
                <img src={city.img} alt={city.name} className="w-full h-72 object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-white text-2xl font-bold mb-1">{city.name}</h3>
                  <p className="text-orange-300 text-sm mb-2">{city.specialty}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm flex items-center gap-1"><Store className="w-4 h-4" /> {city.vendors} vendors</span>
                    <button className="glass px-4 py-1.5 rounded-full text-white text-sm hover:bg-orange-500 transition">Explore <ChevronRight className="w-4 h-4 inline" /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="heading-font text-3xl md:text-4xl font-bold text-gray-900 mb-4">Explore Food Categories</h2>
            <p className="text-gray-500 text-lg">From local soups to street food — we have it all</p>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
            {CATEGORIES.map((cat, i) => (
              <motion.div key={cat.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} viewport={{ once: true }}
                onClick={handleGetStarted}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-orange-50 hover:bg-orange-100 cursor-pointer transition group">
                <span className="text-3xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                <span className="text-xs font-semibold text-gray-700 text-center leading-tight">{cat.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TOP VENDORS */}
      <section id="vendors" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="heading-font text-3xl md:text-4xl font-bold text-gray-900 mb-2">Top-Rated Restaurants</h2>
              <p className="text-gray-500">Loved by thousands across Northern Nigeria</p>
            </div>
            <button onClick={handleGetStarted} className="hidden md:flex items-center gap-2 text-orange-500 font-semibold hover:text-orange-600 transition">
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TOP_VENDORS.map((vendor, i) => (
              <motion.div key={vendor.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                onClick={handleGetStarted}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition cursor-pointer group">
                <div className="relative overflow-hidden">
                  <img src={vendor.img} alt={vendor.name} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-400" />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-bold text-gray-800">{vendor.rating}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-1">{vendor.name}</h3>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {vendor.city}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {vendor.time}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{vendor.reviews} reviews</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PROMO BANNER */}
      <section className="py-16 gradient-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <h2 className="heading-font text-3xl md:text-4xl font-bold text-white mb-4">First Order 10% Off!</h2>
            <p className="text-orange-100 text-lg mb-8">Use code <strong className="bg-white text-orange-500 px-2 py-0.5 rounded font-mono">NORTH10</strong> at checkout — new users only.</p>
            <button onClick={handleGetStarted} className="bg-white text-orange-500 font-bold px-8 py-4 rounded-2xl hover:bg-orange-50 transition shadow-lg">
              Claim Your Discount
            </button>
          </motion.div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="heading-font text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose NorthEats?</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className="text-center p-6 rounded-2xl bg-orange-50 hover:bg-orange-100 transition group">
                <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center text-white mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-orange-200">
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 gradient-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="heading-font text-3xl md:text-4xl font-bold text-white mb-4">What Our Customers Say</h2>
            <p className="text-gray-400 text-lg">Real stories from real food lovers across Northern Nigeria</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className={`glass rounded-2xl p-6 ${i === currentTestimonial ? 'ring-2 ring-orange-400' : ''} transition-all duration-300`}>
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-gray-300 text-sm mb-4 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <img src={t.img} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-gray-400 text-xs">{t.city}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* VENDOR CTA */}
      <section id="vendors" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <span className="text-orange-500 font-semibold text-sm uppercase tracking-wide">For Restaurants & Food Businesses</span>
            <h2 className="heading-font text-3xl md:text-4xl font-bold text-gray-900 mt-3 mb-6">Partner with NorthEats & Grow Your Business</h2>
            <ul className="space-y-4">
              {['Reach thousands of hungry customers daily', 'Easy menu management with image uploads', 'Real-time order notifications', 'Transparent earnings & revenue dashboard', 'Fast onboarding — go live in 24 hours'].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
            <button onClick={() => navigate('/auth?mode=vendor')} className="mt-8 gradient-primary text-white px-8 py-4 rounded-2xl font-semibold hover:opacity-90 transition flex items-center gap-2">
              Register Your Restaurant <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden h-80">
            <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=700&q=80" alt="Restaurant" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-linear-to-t from-orange-900/50 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 glass rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-bold">Average Monthly Revenue</p>
                  <p className="text-orange-300 text-2xl font-bold mt-1">₦450,000</p>
                </div>
                <TrendingUp className="w-12 h-12 text-green-400" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* RIDER CTA */}
      <section id="riders" className="py-24 bg-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden h-80 lg:order-2">
            <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&q=80" alt="Rider" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-linear-to-t from-gray-900/60 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 glass rounded-2xl p-4">
              <p className="text-white font-bold text-sm">Daily Earnings Potential</p>
              <p className="text-orange-300 text-xl font-bold">₦8,000 – ₦15,000</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="lg:order-1">
            <span className="text-orange-500 font-semibold text-sm uppercase tracking-wide">For Dispatch Riders</span>
            <h2 className="heading-font text-3xl md:text-4xl font-bold text-gray-900 mt-3 mb-6">Earn More with NorthEats</h2>
            <ul className="space-y-4">
              {['Set your own hours — work when you want', 'Earn competitive delivery fees per order', 'Get paid quickly after each delivery', 'Be part of a growing network in Northern Nigeria', 'Simple app — no experience needed'].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Bike className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
            <button onClick={() => navigate('/auth?mode=rider')} className="mt-8 bg-gray-900 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-gray-800 transition flex items-center gap-2">
              Start Riding Today <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-20 gradient-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </div>
              <p className="text-orange-100 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="gradient-hero text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-white" />
                </div>
                <span className="heading-font text-xl font-bold">NorthEats</span>
              </div>
              <p className="text-gray-400 text-sm mb-4">Fresh from the North, delivered to your door. The #1 food delivery app in Northern Nigeria.</p>
              <div className="flex gap-3">
                {[Twitter, Instagram, Facebook].map((Icon, i) => (
                  <a key={i} href="#" className="w-9 h-9 glass rounded-lg flex items-center justify-center hover:bg-orange-500 transition">
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
            {[
              { title: 'Company', links: ['About Us', 'Careers', 'Press', 'Blog'] },
              { title: 'For Business', links: ['Become a Vendor', 'Become a Rider', 'Advertise', 'Partnerships'] },
              { title: 'Support', links: ['Help Center', 'Contact Us', 'Privacy Policy', 'Terms of Service'] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-bold mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}><a href="#" className="text-gray-400 hover:text-orange-400 transition text-sm">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">© 2026 NorthEats. All rights reserved. Serving Plateau, Bauchi & Kaduna.</p>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> +234 800 000 0000</span>
              <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> support@northeats.com</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
