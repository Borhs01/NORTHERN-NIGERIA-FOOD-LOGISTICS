import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChefHat, TrendingUp, Package, DollarSign, Star, Bell, LogOut, ChevronRight, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { useAuthStore } from '../../../store/authStore';
import { formatNGN, statusColor } from '../../../utils/constants';
import { Spinner } from '../../../components/shared';

export default function VendorDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [vendor, setVendor] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, today: 0, revenue: 0, rating: 0 });
  const [loading, setLoading] = useState(true);
  const [newOrders, setNewOrders] = useState<Record<string, unknown>[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, ordersRes] = await Promise.all([api.get('/auth/me'), api.get('/orders/vendor/me')]);
      const v = profileRes.data.profile;
      setVendor(v);
      setIsOpen(v?.isOpen || false);
      setOrders(ordersRes.data);
      const allOrders = ordersRes.data as Record<string, unknown>[];
      const today = new Date().toDateString();
      setStats({
        total: allOrders.length,
        today: allOrders.filter((o) => new Date(o.createdAt as string).toDateString() === today).length,
        revenue: allOrders.filter((o) => o.paymentStatus === 'paid').reduce((acc, o) => acc + (o.totalAmount as number), 0),
        rating: v?.averageRating || 0,
      });
      if (v?._id) {
        const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
        const socket = io(socketUrl, { withCredentials: true });
        socketRef.current = socket;
        socket.emit('join_vendor', v._id);
        socket.on('new_order', (order: Record<string, unknown>) => {
          setNewOrders((prev) => [order, ...prev]);
          toast.success('New order received!', { icon: '🛎️' });
        });
      }
    } catch { toast.error('Failed to load dashboard'); }
    finally { setLoading(false); }
  };

  const handleToggle = async () => {
    try {
      const { data } = await api.patch(`/vendors/${vendor?._id}/toggle-open`);
      setIsOpen(data.isOpen);
      toast.success(data.isOpen ? 'You are now Open!' : 'You are now Closed');
    } catch { toast.error('Failed to update status'); }
  };

  const handleOrderAction = async (orderId: string, status: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      setOrders((prev) => prev.map((o) => o._id === orderId ? { ...o, orderStatus: status } : o));
      setNewOrders((prev) => prev.filter((o) => o._id !== orderId));
      toast.success(`Order ${status}`);
    } catch { toast.error('Failed to update order'); }
  };

  const chartData = [
    { day: 'Mon', orders: 8 }, { day: 'Tue', orders: 12 }, { day: 'Wed', orders: 6 },
    { day: 'Thu', orders: 15 }, { day: 'Fri', orders: 20 }, { day: 'Sat', orders: 25 }, { day: 'Sun', orders: 18 },
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />

      {/* TOPBAR */}
      <nav className="bg-white border-b px-4 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">{vendor?.businessName as string}</p>
            <p className="text-gray-400 text-xs">Vendor Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleToggle} className="flex items-center gap-2 text-sm font-medium">
            {isOpen ? <ToggleRight className="w-8 h-8 text-green-500" /> : <ToggleLeft className="w-8 h-8 text-gray-400" />}
            <span className={isOpen ? 'text-green-600' : 'text-gray-500'}>{isOpen ? 'Open' : 'Closed'}</span>
          </button>
          {newOrders.length > 0 && (
            <div className="relative">
              <Bell className="w-6 h-6 text-orange-500 animate-bounce" />
              <span className="absolute -top-1 -right-1 w-4 h-4 gradient-primary text-white text-xs rounded-full flex items-center justify-center">{newOrders.length}</span>
            </div>
          )}
          <button onClick={() => { logout(); navigate('/'); }}><LogOut className="w-5 h-5 text-gray-400 hover:text-red-500 transition" /></button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {/* NEW ORDERS ALERT */}
        {newOrders.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-6">
            <p className="font-bold text-orange-800 mb-3">🛎️ {newOrders.length} new order{newOrders.length > 1 ? 's' : ''}!</p>
            {newOrders.map((order) => {
              const items = order.items as { name: string; qty: number }[];
              const consumer = order.consumerId as Record<string, unknown>;
              return (
                <div key={order._id as string} className="bg-white rounded-xl p-3 mb-2 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{consumer?.name as string}</p>
                    <p className="text-gray-500 text-xs">{items?.map((i) => `${i.name} x${i.qty}`).join(', ')}</p>
                    <p className="text-orange-500 font-bold text-sm mt-1">{formatNGN(order.totalAmount as number)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleOrderAction(order._id as string, 'confirmed')} className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">Accept</button>
                    <button onClick={() => handleOrderAction(order._id as string, 'cancelled')} className="bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold">Reject</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* STATS CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Package className="w-6 h-6" />, label: "Today's Orders", value: stats.today, color: 'text-blue-500', bg: 'bg-blue-50' },
            { icon: <TrendingUp className="w-6 h-6" />, label: 'Total Orders', value: stats.total, color: 'text-purple-500', bg: 'bg-purple-50' },
            { icon: <DollarSign className="w-6 h-6" />, label: 'Total Revenue', value: formatNGN(stats.revenue), color: 'text-green-500', bg: 'bg-green-50' },
            { icon: <Star className="w-6 h-6" />, label: 'Avg Rating', value: stats.rating || '—', color: 'text-yellow-500', bg: 'bg-yellow-50' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm">
              <div className={`w-11 h-11 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-3`}>{stat.icon}</div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-gray-400 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* WEEKLY CHART */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4">Weekly Orders</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="orders" fill="#F97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* QUICK ACTIONS */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {[
                { label: 'Manage Menu', desc: 'Add/edit food items', onClick: () => navigate('/vendor/menu') },
                { label: 'View Orders', desc: 'All incoming orders', onClick: () => navigate('/vendor/orders') },
              ].map((action) => (
                <button key={action.label} onClick={action.onClick}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50 transition">
                  <div className="text-left">
                    <p className="font-semibold text-sm text-gray-800">{action.label}</p>
                    <p className="text-gray-400 text-xs">{action.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RECENT ORDERS */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Recent Orders</h2>
            <button onClick={() => navigate('/vendor/orders')} className="text-orange-500 text-sm font-semibold">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Order ID', 'Customer', 'Items', 'Amount', 'Status', 'Action'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.slice(0, 8).map((order) => {
                  const items = order.items as { name: string; qty: number }[];
                  const consumer = order.consumerId as Record<string, unknown>;
                  return (
                    <tr key={order._id as string} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-xs text-gray-500 font-mono">#{(order._id as string).slice(-6).toUpperCase()}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{consumer?.name as string}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-32 truncate">{items?.map((i) => i.name).join(', ')}</td>
                      <td className="px-4 py-3 text-sm font-bold text-orange-500">{formatNGN(order.totalAmount as number)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor[order.orderStatus as string]}`}>
                          {(order.orderStatus as string).replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {order.orderStatus === 'confirmed' && (
                          <button onClick={() => handleOrderAction(order._id as string, 'preparing')} className="text-xs gradient-primary text-white px-3 py-1 rounded-lg">Mark Preparing</button>
                        )}
                        {order.orderStatus === 'preparing' && (
                          <button onClick={() => handleOrderAction(order._id as string, 'ready')} className="text-xs bg-blue-500 text-white px-3 py-1 rounded-lg">Mark Ready</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
