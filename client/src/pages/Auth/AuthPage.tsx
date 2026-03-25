import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, User, Store, Bike, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { STATES } from '../../utils/constants';
import AddressInputDark from '../../components/shared/AddressInputDark';

const ROLES = [
  { key: 'consumer', icon: <User className="w-6 h-6" />, label: 'Customer', desc: 'Order food from local vendors' },
  { key: 'vendor', icon: <Store className="w-6 h-6" />, label: 'Restaurant', desc: 'List your menu and receive orders' },
  { key: 'rider', icon: <Bike className="w-6 h-6" />, label: 'Rider', desc: 'Deliver orders and earn daily' },
];

export default function AuthPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { setAuth } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState(1);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', role: params.get('mode') || 'consumer',
    state: '', lga: '', address: '', businessName: '', vehicleType: 'bike',
  });

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const getLgas = () => form.state ? STATES[form.state as keyof typeof STATES]?.lgas || [] : [];

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload = mode === 'login'
        ? { email: form.email || undefined, phone: form.phone || undefined, password: form.password }
        : form;
      const { data } = await api.post(endpoint, payload);
      setAuth(data.user, data.token);
      toast.success(mode === 'login' ? 'Welcome back!' : 'Account created!');
      const role = data.user.role;
      if (role === 'consumer') navigate('/home');
      else if (role === 'vendor') navigate('/vendor/dashboard');
      else if (role === 'rider') navigate('/rider/dashboard');
      else navigate('/admin');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-4 py-12">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet" />

      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-6 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </button>
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <span className="heading-font text-2xl font-bold text-white">NorthEats</span>
          </div>
          <p className="text-gray-400">{mode === 'login' ? 'Welcome back! Sign in to continue.' : 'Create your account to get started.'}</p>
        </div>

        <div className="glass rounded-3xl p-8">
          <div className="flex rounded-xl overflow-hidden mb-8 border border-white/10">
            {(['login', 'register'] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setStep(1); }}
                className={`flex-1 py-2.5 text-sm font-semibold transition capitalize ${mode === m ? 'gradient-primary text-white' : 'text-gray-400 hover:text-white'}`}>
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {mode === 'register' && step === 1 ? (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <p className="text-white font-semibold mb-4">I want to join as a...</p>
                <div className="space-y-3">
                  {ROLES.map((r) => (
                    <button key={r.key} onClick={() => update('role', r.key)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition ${form.role === r.key ? 'border-orange-500 bg-orange-500/10' : 'border-white/10 hover:border-white/30'}`}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${form.role === r.key ? 'gradient-primary text-white' : 'bg-white/10 text-gray-300'}`}>
                        {r.icon}
                      </div>
                      <div className="text-left">
                        <p className={`font-semibold ${form.role === r.key ? 'text-white' : 'text-gray-300'}`}>{r.label}</p>
                        <p className="text-gray-400 text-sm">{r.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <button onClick={() => setStep(2)} className="w-full gradient-primary text-white py-3 rounded-xl font-semibold mt-6 hover:opacity-90 transition">
                  Continue
                </button>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                {mode === 'register' && (
                  <div>
                    <label className="block text-gray-300 text-sm mb-1">Full Name *</label>
                    <input value={form.name} onChange={(e) => update('name', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-500 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400 transition"
                      placeholder="Aisha Musa" />
                  </div>
                )}
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Email Address</label>
                  <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-500 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400 transition"
                    placeholder="aisha@example.com" />
                </div>
                {mode === 'register' && (
                  <div>
                    <label className="block text-gray-300 text-sm mb-1">Phone Number</label>
                    <input value={form.phone} onChange={(e) => update('phone', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-500 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400 transition"
                      placeholder="+234 800 000 0000" />
                  </div>
                )}
                <div>
                  <label className="block text-gray-300 text-sm mb-1">Password *</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} value={form.password} onChange={(e) => update('password', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-500 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-orange-400 transition"
                      placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                      {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                {mode === 'register' && (
                  <>
                    <div>
                      <label className="block text-gray-300 text-sm mb-1">State *</label>
                      <select value={form.state} onChange={(e) => { update('state', e.target.value); update('lga', ''); }}
                        className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400 transition">
                        <option value="" className="text-gray-900">Select state...</option>
                        {Object.entries(STATES).map(([key, val]) => (
                          <option key={key} value={key} className="text-gray-900">{val.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm mb-1">LGA *</label>
                      <select value={form.lga} onChange={(e) => update('lga', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400 transition">
                        <option value="" className="text-gray-900">Select LGA...</option>
                        {getLgas().map((l) => <option key={l} value={l} className="text-gray-900">{l}</option>)}
                      </select>
                    </div>
                    {form.role === 'vendor' && (
                      <>
                        <div>
                          <label className="block text-gray-300 text-sm mb-1">Restaurant Name *</label>
                          <input value={form.businessName} onChange={(e) => update('businessName', e.target.value)}
                            className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-500 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400 transition"
                            placeholder="Your Restaurant Name" />
                        </div>
                        <AddressInputDark
                          value={form.address}
                          onChange={(address) => update('address', address)}
                          label="Restaurant Address *"
                          placeholder="Search restaurant location (e.g., Ahmadu Bello Way, Jos)"
                        />
                      </>
                    )}
                    {form.role === 'rider' && (
                      <div>
                        <label className="block text-gray-300 text-sm mb-1">Vehicle Type *</label>
                        <select value={form.vehicleType} onChange={(e) => update('vehicleType', e.target.value)}
                          className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-400 transition">
                          <option value="bike" className="text-gray-900">Motorcycle</option>
                          <option value="car" className="text-gray-900">Car</option>
                          <option value="tricycle" className="text-gray-900">Tricycle (Keke)</option>
                        </select>
                      </div>
                    )}
                  </>
                )}

                {mode === 'register' && step === 2 && (
                  <button type="button" onClick={() => setStep(1)} className="text-sm text-gray-400 hover:text-white transition flex items-center gap-1">
                    <ArrowLeft className="w-3.5 h-3.5" /> Change role
                  </button>
                )}

                <button onClick={handleSubmit} disabled={loading}
                  className="w-full gradient-primary text-white py-3.5 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-60 mt-2">
                  {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setStep(1); }} className="text-orange-400 hover:text-orange-300 font-semibold transition">
            {mode === 'login' ? 'Register' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}
