import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { formatNGN, ORDER_STATUS_STEPS, statusColor } from '../../../utils/constants';
import { Spinner } from '../../../components/shared';

interface OrderItem {
  name: string;
  qty: number;
  unitPrice: number;
  image: string;
}

interface Order {
  _id: string;
  consumerId: Record<string, unknown>;
  vendorId: Record<string, unknown>;
  riderId?: Record<string, unknown> | null;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  paymentRef: string;
  paymentChannel: string;
  deliveryAddress: string;
  deliveryLga: string;
  state: string;
  orderStatus: string;
  paymentStatus: string;
  cancelReason?: string;
  isReviewed?: boolean;
}

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/${id}`).then(({ data }) => setOrder(data)).catch(() => toast.error('Not found')).finally(() => setLoading(false));
  }, [id]);

  const handleStatusOverride = async () => {
    const statuses = ORDER_STATUS_STEPS.map((s) => s.key).join(', ');
    const newStatus = prompt(`Set status (${statuses}, cancelled):`);
    if (!newStatus) return;
    await api.patch(`/admin/orders/${id}/status`, { status: newStatus });
    setOrder((p: Order | null) => p ? { ...p, orderStatus: newStatus } : p);
    toast.success('Status updated');
  };

  const handleRefund = async () => {
    if (!confirm('Trigger Paystack refund for this order?')) return;
    try {
      await api.post(`/payments/refund/${id}`);
      toast.success('Refund initiated');
      setOrder((p: Order | null) => p ? { ...p, paymentStatus: 'refunded', orderStatus: 'cancelled' } : p);
    } catch { toast.error('Refund failed'); }
  };

  if (loading) return <div className="flex justify-center py-32"><Spinner size="lg" /></div>;
  if (!order) return null;

  const consumer = order.consumerId as Record<string, unknown>;
  const vendor = order.vendorId as Record<string, unknown>;
  const rider = order.riderId as Record<string, unknown> | null;
  const items = order.items as { name: string; qty: number; unitPrice: number; image: string }[];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/orders')} className="p-2 hover:bg-gray-100 rounded-xl"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
          <p className="text-gray-400 font-mono text-sm">#{(order._id as string).slice(-8).toUpperCase()}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ORDER ITEMS */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">Items from {vendor?.businessName as string}</h2>
          <div className="space-y-3 mb-6">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                {item.image && <img src={item.image} alt="" className="w-12 h-12 rounded-xl object-cover" />}
                <div className="flex-1"><p className="font-medium text-sm">{item.name}</p><p className="text-gray-400 text-xs">x{item.qty} @ {formatNGN(item.unitPrice)}</p></div>
                <span className="font-bold text-sm">{formatNGN(item.unitPrice * item.qty)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatNGN(order.subtotal as number)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Delivery Fee</span><span>{formatNGN(order.deliveryFee as number)}</span></div>
            <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total</span><span className="text-orange-500">{formatNGN(order.totalAmount as number)}</span></div>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-4">
          {/* STATUS */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-3">Status</h2>
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColor[order.orderStatus as string]}`}>{(order.orderStatus as string)?.replace('_', ' ')}</span>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColor[order.paymentStatus as string]}`}>{order.paymentStatus as string}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={handleStatusOverride} className="flex-1 border border-gray-200 text-gray-700 py-2 rounded-xl text-xs font-semibold hover:bg-gray-50 flex items-center justify-center gap-1">
                <RefreshCw className="w-3.5 h-3.5" /> Override Status
              </button>
              {order.paymentStatus === 'paid' && (
                <button onClick={handleRefund} className="flex-1 bg-red-100 text-red-600 py-2 rounded-xl text-xs font-semibold hover:bg-red-200">Refund</button>
              )}
            </div>
          </div>

          {/* PEOPLE */}
          {[
            { label: 'Consumer', data: consumer, sub: consumer?.phone as string },
            { label: 'Vendor', data: { name: vendor?.businessName as string }, sub: vendor?.lga as string + ', ' + (vendor?.state as string) },
            ...(rider ? [{ label: 'Rider', data: rider, sub: rider?.phone as string }] : []),
          ].map((p) => {
            const displayName = ((p.data as Record<string, unknown>)?.name as string) || 'N/A';
            return (
              <div key={p.label} className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-xs text-gray-400 font-semibold uppercase mb-2">{p.label}</p>
                <p className="font-semibold text-gray-900">{displayName}</p>
                <p className="text-gray-400 text-sm">{p.sub}</p>
              </div>
            );
          })}

          {/* DELIVERY INFO */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-gray-400 font-semibold uppercase mb-2">Delivery Address</p>
            <p className="text-gray-700 text-sm">{order.deliveryAddress as string}</p>
            <p className="text-gray-400 text-xs mt-1 capitalize">{order.deliveryLga as string} · {order.state as string}</p>
          </div>

          {/* PAYMENT */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-gray-400 font-semibold uppercase mb-2">Payment Reference</p>
            <p className="font-mono text-xs text-gray-700 break-all">{(order.paymentRef as string) || '—'}</p>
            {order.paymentChannel && <p className="text-gray-400 text-xs mt-1 capitalize">via {order.paymentChannel as string}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
