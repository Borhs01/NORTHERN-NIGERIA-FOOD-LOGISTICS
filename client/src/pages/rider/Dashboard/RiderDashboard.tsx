import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bike, DollarSign, Package, ToggleLeft, ToggleRight, MapPin, Clock, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { useAuthStore } from '../../../store/authStore';
import { formatNGN, statusColor } from '../../../utils/constants';
import { Spinner, ProfileDropdown } from '../../../components/shared';

interface RiderProfile {
  isApproved?: boolean;
  isSuspended?: boolean;
  totalDeliveries?: number;
  totalEarnings?: number;
  vehicleType?: string;
  isOnline?: boolean;
}

interface OrderItem {
  name: string;
  qty: number;
}

interface VendorRef {
  businessName?: string;
  lga?: string;
  state?: string;
}

interface ConsumerRef {
  name?: string;
  phone?: string;
}

interface DeliveryOrder {
  _id: string;
  vendorId?: VendorRef;
  consumerId?: ConsumerRef;
  items?: OrderItem[];
  orderStatus?: string;
  totalAmount?: number;
  deliveryAddress?: string;
  deliveryLga?: string;
  state?: string;
}

export default function RiderDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [rider, setRider] = useState<RiderProfile | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [available, setAvailable] = useState<DeliveryOrder[]>([]);
  const [myDeliveries, setMyDeliveries] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const isApproved = Boolean(rider?.isApproved);
  const isSuspended = Boolean(rider?.isSuspended);

  useEffect(() => {
    const initRider = async () => {
      try {
        const { data } = await api.get('/auth/me');
        setRider(data.profile);
        setIsOnline(data.profile?.isOnline || false);
      } catch {
        toast.error('Failed to load rider profile');
      }
      setLoading(false);
    };
    initRider();
  }, []);

  const fetchAvailable = useCallback(async () => {
    try {
      const { data } = await api.get('/orders/rider/available');
      setAvailable(data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; code?: string } } };
      const errorCode = error.response?.data?.code;
      const message = error.response?.data?.message || 'Failed to load deliveries';

      if (errorCode === 'RIDER_NOT_APPROVED') {
        toast.error('⏳ Waiting for admin approval to start accepting deliveries');
      } else if (errorCode === 'RIDER_SUSPENDED') {
        toast.error('❌ Your account is suspended');
      } else {
        toast.error(message);
      }
    }
  }, []);

  const fetchMyDeliveries = useCallback(async () => {
    try {
      const { data } = await api.get('/orders/rider/me');
      setMyDeliveries(data);
    } catch (error) {
      console.error('Failed to load my deliveries:', error);
    }
  }, []);

  useEffect(() => {
    if (!isOnline) return;

    const loadRiderOrders = async () => {
      await fetchAvailable();
      await fetchMyDeliveries();
    };

    loadRiderOrders();
    const interval = setInterval(loadRiderOrders, 10000);
    return () => clearInterval(interval);
  }, [isOnline, fetchAvailable, fetchMyDeliveries]);

  const toggleOnline = async () => {
    try {
      await api.patch('/riders/toggle-online');
      setIsOnline(!isOnline);
      if (!isOnline) fetchAvailable();
      toast.success(isOnline ? 'You are offline' : 'You are online!');
    } catch { toast.error('Failed to update status'); }
  };

  const acceptDelivery = async (orderId: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: 'ready_for_pickup', riderId: user?._id });
      setAvailable((p) => p.filter((o) => o._id !== orderId));
      await fetchMyDeliveries(); // Refresh my deliveries after accepting
      toast.success('Delivery accepted!');
    } catch { toast.error('Failed to accept delivery'); }
  };

  const markDelivered = async (orderId: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: 'completed' });
      await fetchMyDeliveries(); // Refresh my deliveries after marking delivered
      toast.success('Delivery completed!');
    } catch { toast.error('Failed to update'); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <nav className="bg-white border-b px-4 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center"><Bike className="w-5 h-5 text-white" /></div>
          <div>
            <p className="font-bold text-sm">{user?.name}</p>
            <p className="text-gray-400 text-xs">Rider Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleOnline} className="flex items-center gap-2">
            {isOnline ? <ToggleRight className="w-9 h-9 text-green-500" /> : <ToggleLeft className="w-9 h-9 text-gray-400" />}
            <span className={`text-sm font-semibold ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>{isOnline ? 'Online' : 'Offline'}</span>
          </button>
          <ProfileDropdown
            user={user}
            onNavigate={(path) => navigate(path)}
            onLogout={() => { logout(); navigate('/'); }}
            supportEmail="support@northeats.com"
            supportPhone="+234 800 000 0000"
          />
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* STATS */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: <Package className="w-5 h-5" />, label: 'Total Deliveries', value: (rider?.totalDeliveries as number) || 0, bg: 'bg-blue-50', color: 'text-blue-500' },
            { icon: <DollarSign className="w-5 h-5" />, label: 'Total Earnings', value: formatNGN((rider?.totalEarnings as number) || 0), bg: 'bg-green-50', color: 'text-green-500' },
            { icon: <Bike className="w-5 h-5" />, label: 'Vehicle', value: (rider?.vehicleType as string) || 'bike', bg: 'bg-orange-50', color: 'text-orange-500' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className={`w-9 h-9 ${s.bg} ${s.color} rounded-xl flex items-center justify-center mb-2`}>{s.icon}</div>
              <p className="font-bold text-gray-900 text-sm">{String(s.value)}</p>
              <p className="text-gray-400 text-xs">{s.label}</p>
            </div>
          ))}
        </div>

        {/* APPROVAL STATUS BANNER */}
        {!isApproved && (
          <div className="bg-yellow-50 rounded-2xl p-6 border border-yellow-200">
            <p className="font-semibold text-yellow-800 mb-2">⏳ Pending Approval</p>
            <p className="text-yellow-700 text-sm">Your rider profile is under review by our admin team. You'll be able to accept deliveries once approved.</p>
          </div>
        )}

        {isSuspended && (
          <div className="bg-red-50 rounded-2xl p-6 border border-red-200">
            <p className="font-semibold text-red-800 mb-2">❌ Account Suspended</p>
            <p className="text-red-700 text-sm">Your account has been suspended. Please contact support for more information.</p>
          </div>
        )}

        {/* ONLINE STATUS BANNER */}
        {!isOnline && (
          <div className="bg-gray-100 rounded-2xl p-6 text-center">
            <Bike className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-gray-600 mb-1">You are offline</p>
            <p className="text-gray-400 text-sm mb-4">Go online to start receiving delivery requests</p>
            <button onClick={toggleOnline} className="gradient-primary text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition">Go Online</button>
          </div>
        )}

        {/* AVAILABLE DELIVERIES */}
        {isOnline && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Available Deliveries</h2>
              <button onClick={fetchAvailable} className="text-orange-500 text-sm">Refresh</button>
            </div>
            {available.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                <Clock className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500">No deliveries available right now</p>
                <p className="text-gray-400 text-sm mt-1">New orders will appear here when ready</p>
              </div>
            ) : (
              <div className="space-y-4">
                {available.map((order) => {
                  const vendor = order.vendorId as Record<string, unknown>;
                  const items = order.items as { name: string; qty: number }[];
                  return (
                    <div key={order._id as string} className="bg-white rounded-2xl p-5 shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-bold text-gray-900">{vendor?.businessName as string}</p>
                          <p className="text-gray-500 text-sm flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{vendor?.lga as string}, {vendor?.state as string}</p>
                          <p className="text-gray-400 text-xs mt-1">{items?.map((i) => `${i.name} x${i.qty}`).join(' · ')}</p>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor[order.orderStatus as string]}`}>{(order.orderStatus as string).replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-orange-500">{formatNGN(order.totalAmount as number)}</span>
                        <div className="flex gap-2">
                          <button onClick={() => acceptDelivery(order._id as string)} className="gradient-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition">Accept</button>
                          <button onClick={() => markDelivered(order._id as string)} className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition">Delivered</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MY DELIVERIES */}
        {isOnline && myDeliveries.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">My Deliveries</h2>
              <button onClick={fetchMyDeliveries} className="text-orange-500 text-sm">Refresh</button>
            </div>
            <div className="space-y-4">
              {myDeliveries.map((order) => {
                const consumer = order.consumerId as Record<string, unknown>;
                const vendor = order.vendorId as Record<string, unknown>;
                const items = order.items as { name: string; qty: number }[];
                return (
                  <div key={order._id as string} className="bg-white rounded-2xl p-5 shadow-sm border-2 border-blue-200">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-gray-900">Deliver to: {consumer?.name as string}</p>
                        <p className="text-gray-500 text-sm flex items-center gap-1 mb-1">
                          <MapPin className="w-3.5 h-3.5 text-red-500" />
                          {order.deliveryAddress as string}, {order.deliveryLga as string}, {order.state as string}
                        </p>
                        <p className="text-gray-500 text-sm flex items-center gap-1 mb-2">
                          <Phone className="w-3.5 h-3.5 text-green-500" />
                          {consumer?.phone as string}
                        </p>
                        <p className="text-gray-600 text-sm">From: {vendor?.businessName as string}</p>
                        <p className="text-gray-400 text-xs mt-1">{items?.map((i) => `${i.name} x${i.qty}`).join(' · ')}</p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor[order.orderStatus as string]}`}>{(order.orderStatus as string).replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-orange-500">{formatNGN(order.totalAmount as number)}</span>
                      <div className="flex gap-2">
                        {(order.orderStatus === 'ready_for_pickup' || order.orderStatus === 'on_the_way') && (
                          <button 
                            onClick={() => navigate(`/rider/delivery/${order._id}`)} 
                            className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition"
                          >
                            Start Delivery
                          </button>
                        )}
                        <button onClick={() => markDelivered(order._id as string)} className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition">
                          Mark Delivered
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
