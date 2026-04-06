import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Pause, XCircle, Star, ShoppingBag, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { formatNGN, statusColor } from '../../../utils/constants';
import { Spinner } from '../../../components/shared';

interface Vendor {
  _id: string;
  userId: string;
  businessName: string;
  description: string;
  logo: string;
  coverImage: string;
  state: string;
  lga: string;
  address: string;
  coordinates: { lat: number; lng: number };
  categories: string[];
  isOpen: boolean;
  isApproved: boolean;
  isSuspended: boolean;
  suspendedReason: string;
  rejectionReason: string;
  averageRating: number;
  totalOrders: number;
  totalRevenue: number;
  deliveryFee: number;
  minOrder: number;
  estimatedDeliveryTime: string;
  openingHours: string;
  phone: string;
}

interface VendorOrder {
  _id: string;
  consumerId: Record<string, unknown>;
  vendorId: Record<string, unknown>;
  orderStatus: string;
  paymentStatus: string;
  totalAmount: number;
  deliveryAddress: string;
  createdAt: string;
}

interface Review {
  _id: string;
  consumerId: Record<string, unknown>;
  vendorId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function VendorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/vendors/${id}`),
      api.get(`/admin/orders?vendor=${id}&limit=10`),
      api.get(`/reviews/vendor/${id}`),
    ]).then(([vRes, oRes, rRes]) => {
      setVendor(vRes.data.vendor);
      setOrders(oRes.data.orders || []);
      setReviews(rRes.data || []);
    }).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, [id]);

  const handleApprove = async () => {
    await api.patch(`/admin/vendors/${id}/approve`);
    setVendor((p: Vendor | null) => p ? { ...p, isApproved: true } : p);
    toast.success('Vendor approved!');
  };

  const handleSuspend = async () => {
    const reason = prompt('Reason for suspension:');
    if (reason === null) return;
    await api.patch(`/admin/vendors/${id}/suspend`, { reason });
    setVendor((p: Vendor | null) => p ? { ...p, isSuspended: true } : p);
    toast.success('Vendor suspended');
  };

  const handleUnsuspend = async () => {
    await api.patch(`/admin/vendors/${id}/unsuspend`);
    setVendor((p: Vendor | null) => p ? { ...p, isSuspended: false } : p);
    toast.success('Vendor unsuspended');
  };

  if (loading) return <div className="flex justify-center py-32"><Spinner size="lg" /></div>;
  if (!vendor) return <div className="text-center py-20 text-gray-500">Vendor not found</div>;

  const badge = vendor.isSuspended ? { label: 'Suspended', cls: 'bg-red-100 text-red-700' }
    : vendor.isApproved ? { label: 'Approved', cls: 'bg-green-100 text-green-700' }
    : { label: 'Pending', cls: 'bg-yellow-100 text-yellow-700' };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/vendors')} className="p-2 hover:bg-gray-100 rounded-xl transition"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{vendor.businessName as string}</h1>
          <p className="text-gray-500 text-sm capitalize">{vendor.state as string} · {vendor.lga as string}</p>
        </div>
        <span className={`ml-auto px-3 py-1 rounded-full text-sm font-semibold ${badge.cls}`}>{badge.label}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* PROFILE */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            {vendor.logo ? (
              <img src={vendor.logo as string} alt="" className="w-16 h-16 rounded-2xl object-cover" />
            ) : (
              <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                {(vendor.businessName as string)[0]}
              </div>
            )}
            <div>
              <p className="font-bold text-gray-900">{vendor.businessName as string}</p>
              <p className="text-gray-400 text-sm">{vendor.address as string}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { icon: <ShoppingBag className="w-4 h-4" />, label: 'Orders', value: (vendor.totalOrders as number) || 0 },
              { icon: <Star className="w-4 h-4" />, label: 'Rating', value: (vendor.averageRating as number) ? `⭐ ${(vendor.averageRating as number)}` : '—' },
              { icon: <DollarSign className="w-4 h-4" />, label: 'Revenue', value: formatNGN((vendor.totalRevenue as number) || 0) },
            ].map((s) => (
              <div key={s.label} className="text-center p-2 bg-gray-50 rounded-xl">
                <div className="flex justify-center text-orange-500 mb-1">{s.icon}</div>
                <p className="font-bold text-gray-900 text-sm">{String(s.value)}</p>
                <p className="text-gray-400 text-xs">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            {!vendor.isApproved && !vendor.isSuspended && (
              <button onClick={handleApprove} className="flex-1 bg-green-500 text-white py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1 hover:bg-green-600 transition">
                <CheckCircle className="w-4 h-4" /> Approve
              </button>
            )}
            {!vendor.isSuspended && (
              <button onClick={handleSuspend} className="flex-1 bg-red-100 text-red-600 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1 hover:bg-red-200 transition">
                <Pause className="w-4 h-4" /> Suspend
              </button>
            )}
            {vendor.isSuspended && (
              <button onClick={handleUnsuspend} className="flex-1 bg-blue-100 text-blue-600 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1 hover:bg-blue-200 transition">
                <XCircle className="w-4 h-4" /> Unsuspend
              </button>
            )}
          </div>
        </div>

        {/* RECENT ORDERS */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b"><h2 className="font-bold text-gray-900">Recent Orders</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50"><tr>
                {['Order ID', 'Customer', 'Amount', 'Status', 'Date'].map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {orders.slice(0, 8).map((o) => {
                  const c = o.consumerId as Record<string, unknown>;
                  return (
                    <tr key={o._id as string} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-2 text-xs text-gray-400 font-mono">#{(o._id as string).slice(-6).toUpperCase()}</td>
                      <td className="px-4 py-2 text-sm text-gray-800">{c?.name as string}</td>
                      <td className="px-4 py-2 text-sm font-bold text-orange-500">{formatNGN(o.totalAmount as number)}</td>
                      <td className="px-4 py-2"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor[o.orderStatus as string]}`}>{(o.orderStatus as string)?.replace('_', ' ')}</span></td>
                      <td className="px-4 py-2 text-xs text-gray-400">{new Date(o.createdAt as string).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* REVIEWS */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-4">Customer Reviews ({reviews.length})</h2>
        {reviews.length === 0 ? <p className="text-gray-400 text-sm">No reviews yet</p> : (
          <div className="grid sm:grid-cols-2 gap-4">
            {reviews.map((r) => {
              const consumer = r.consumerId as Record<string, unknown>;
              return (
                <div key={r._id as string} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center text-white text-xs font-bold">{(consumer?.name as string)?.[0]}</div>
                    <p className="font-medium text-sm text-gray-800">{consumer?.name as string}</p>
                    <div className="ml-auto flex">{[...Array(r.rating as number)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}</div>
                  </div>
                  <p className="text-gray-500 text-sm">{r.comment as string}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
