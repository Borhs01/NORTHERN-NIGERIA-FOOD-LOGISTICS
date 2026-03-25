import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import {
  ShoppingBag, DollarSign, Store, Bike, Users, AlertCircle,
  TrendingUp, Clock, ArrowRight, RefreshCw
} from 'lucide-react';
import api from '../../../services/api';
import { formatNGN, statusColor } from '../../../utils/constants';
import { Spinner } from '../../../components/shared';

const PIE_COLORS = ['#16A34A', '#F97316', '#EF4444', '#3B82F6', '#8B5CF6'];

export default function AdminOverview() {
  const navigate = useNavigate();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/admin/stats');
      setData(res);
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
      toast.error('Failed to load admin dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-32"><Spinner size="lg" /></div>;

  const kpi = (data?.kpi as Record<string, number>) || {};
  const charts = (data?.charts as Record<string, unknown>) || {};
  const recentOrders = (data?.recentOrders as Record<string, unknown>[]) || [];
  const recentVendors = (data?.recentVendors as Record<string, unknown>[]) || [];

  const ordersByStatus = ((charts.ordersByStatus as { _id: string; count: number }[]) || []).map((s) => ({
    name: s._id.replace('_', ' '),
    value: s.count,
  }));

  const revenueByState = ((charts.revenueByState as { _id: string; revenue: number }[]) || []).map((s) => ({
    state: s._id,
    revenue: s.revenue,
  }));

  const ordersLast30 = ((charts.ordersLast30 as { _id: string; count: number }[]) || []).map((d) => ({
    date: d._id.slice(5),
    orders: d.count,
  }));

  const signupsTrend = ((charts.signupsTrend as { _id: string; count: number }[]) || []).map((d) => ({
    date: d._id.slice(5),
    users: d.count,
  }));

  const KPI_CARDS = [
    { label: "Today's Orders", value: kpi.todayOrders ?? 0, icon: <ShoppingBag className="w-6 h-6" />, color: 'text-blue-400', bg: 'bg-blue-500/10', trend: `${kpi.weekOrders} this week` },
    { label: 'Total Revenue', value: formatNGN(kpi.totalRevenue ?? 0), icon: <DollarSign className="w-6 h-6" />, color: 'text-green-400', bg: 'bg-green-500/10', trend: 'All time' },
    { label: 'Active Vendors', value: kpi.activeVendors ?? 0, icon: <Store className="w-6 h-6" />, color: 'text-orange-400', bg: 'bg-orange-500/10', trend: `${kpi.pendingVendors} pending` },
    { label: 'Active Riders', value: kpi.activeRiders ?? 0, icon: <Bike className="w-6 h-6" />, color: 'text-purple-400', bg: 'bg-purple-500/10', trend: `${kpi.onlineRiders} online now` },
    { label: 'Consumers', value: kpi.totalConsumers ?? 0, icon: <Users className="w-6 h-6" />, color: 'text-cyan-400', bg: 'bg-cyan-500/10', trend: 'Registered' },
    { label: 'Pending Approvals', value: kpi.pendingVendors ?? 0, icon: <AlertCircle className="w-6 h-6" />, color: 'text-red-400', bg: 'bg-red-500/10', trend: 'Vendors awaiting', alert: (kpi.pendingVendors ?? 0) > 0 },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back — here's what's happening on NorthEats</p>
        </div>
        <button onClick={fetchStats} className="flex items-center gap-2 text-sm text-gray-500 hover:text-orange-500 transition border border-gray-200 px-3 py-2 rounded-xl">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {KPI_CARDS.map((card) => (
          <div key={card.label} className={`bg-white rounded-2xl p-4 shadow-sm border ${card.alert ? 'border-red-200' : 'border-transparent'} hover:shadow-md transition`}>
            <div className={`w-10 h-10 ${card.bg} ${card.color} rounded-xl flex items-center justify-center mb-3`}>{card.icon}</div>
            <p className="text-xl font-bold text-gray-900">{card.value}</p>
            <p className="text-gray-500 text-xs font-medium mt-0.5">{card.label}</p>
            <p className={`text-xs mt-1 ${card.alert ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>{card.trend}</p>
          </div>
        ))}
      </div>

      {/* QUICK ACTIONS */}
      <div className="flex flex-wrap gap-3 mb-8">
        {[
          { label: 'Approve Vendors', path: '/admin/vendors/pending', color: 'bg-orange-500' },
          { label: 'View Flagged Reviews', path: '/admin/reviews', color: 'bg-red-500' },
          { label: 'Create Promotion', path: '/admin/promotions', color: 'bg-green-500' },
          { label: 'View All Orders', path: '/admin/orders', color: 'bg-blue-500' },
        ].map((a) => (
          <button key={a.label} onClick={() => navigate(a.path)}
            className={`${a.color} text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition flex items-center gap-2`}>
            {a.label} <ArrowRight className="w-4 h-4" />
          </button>
        ))}
      </div>

      {/* CHARTS ROW 1 */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Orders Last 30 Days */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-1">Orders — Last 30 Days</h2>
          <p className="text-gray-400 text-xs mb-4">Daily order volume</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={ordersLast30}>
              <defs>
                <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={4} />
              <YAxis hide />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
              <Area type="monotone" dataKey="orders" stroke="#F97316" strokeWidth={2} fill="url(#orderGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by State */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-1">Revenue by State</h2>
          <p className="text-gray-400 text-xs mb-4">Paid orders total (₦)</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={revenueByState}>
              <XAxis dataKey="state" tick={{ fontSize: 11, fill: '#6b7280', textTransform: 'capitalize' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip formatter={(v: number) => formatNGN(v)} contentStyle={{ borderRadius: '12px', border: 'none', fontSize: 12 }} />
              <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
                {revenueByState.map((_, i) => <Cell key={i} fill={['#F97316', '#16A34A', '#3B82F6'][i % 3]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CHARTS ROW 2 */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Orders by Status */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">Orders by Status</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={ordersByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}
                fontSize={10}>
                {ordersByStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* User Signups Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-1">New User Signups</h2>
          <p className="text-gray-400 text-xs mb-4">Last 30 days</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={signupsTrend}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={4} />
              <YAxis hide />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: 12 }} />
              <Line type="monotone" dataKey="users" stroke="#16A34A" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* RECENT ACTIVITY */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Recent Orders</h2>
            <button onClick={() => navigate('/admin/orders')} className="text-orange-500 text-xs font-semibold hover:underline">View All</button>
          </div>
          <div className="divide-y divide-gray-50">
            {recentOrders.slice(0, 6).map((order) => {
              const consumer = order.consumerId as Record<string, unknown>;
              const vendor = order.vendorId as Record<string, unknown>;
              return (
                <div key={order._id as string} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition cursor-pointer" onClick={() => navigate(`/admin/orders/${order._id}`)}>
                  <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {(consumer?.name as string)?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{consumer?.name as string}</p>
                    <p className="text-gray-400 text-xs truncate">{vendor?.businessName as string}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-orange-500">{formatNGN(order.totalAmount as number)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColor[order.orderStatus as string]}`}>{(order.orderStatus as string)?.replace('_', ' ')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pending Vendor Approvals */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b flex items-center justify-between">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              Pending Approvals
              {kpi.pendingVendors > 0 && <span className="gradient-primary text-white text-xs px-2 py-0.5 rounded-full">{kpi.pendingVendors}</span>}
            </h2>
            <button onClick={() => navigate('/admin/vendors/pending')} className="text-orange-500 text-xs font-semibold hover:underline">View All</button>
          </div>
          <div className="divide-y divide-gray-50">
            {recentVendors.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No pending approvals</div>
            ) : recentVendors.map((vendor) => (
              <div key={vendor._id as string} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition cursor-pointer" onClick={() => navigate(`/admin/vendors/${vendor._id}`)}>
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                  <Store className="w-4 h-4 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{vendor.businessName as string}</p>
                  <p className="text-gray-400 text-xs capitalize">{vendor.state as string} · {vendor.lga as string}</p>
                </div>
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold shrink-0">Pending</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
