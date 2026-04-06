import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, Bike, Phone } from 'lucide-react';
import socket from '../../../services/socket';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { formatNGN, ORDER_STATUS_STEPS, statusColor } from '../../../utils/constants';
import { Spinner } from '../../../components/shared';

interface Order {
  _id: string;
  orderStatus: string;
  paymentStatus: string;
  items: { name: string; qty: number; unitPrice: number; image: string }[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  deliveryAddress: string;
  vendorId: { businessName: string; address: string; logo: string };
  riderId: { name: string; phone: string } | null;
  createdAt: string;
}

export default function OrderTrackingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeOrder();
  }, [id]);

  const initializeOrder = async () => {
    try {
      await fetchOrder();
      
      // Check if returning from Paystack payment and verify
      let reference = new URLSearchParams(window.location.search).get('reference');
      
      // Fallback: check sessionStorage if URL param not present
      if (!reference) {
        reference = sessionStorage.getItem('paymentReference');
      }
      
      if (reference) {
        try {
          await api.post('/payments/verify', { reference });
          await fetchOrder(); // Refresh after verification
          toast.success('Payment verified!');
          // Clear sessionStorage after successful verification
          sessionStorage.removeItem('paymentReference');
          sessionStorage.removeItem('orderId');
        } catch (err) {
          // Verification might fail if already verified or invalid reference
          console.log('Payment verification:', err);
        }
      }
      
      // Setup socket connection after order is loaded
      socket.emit('join_order', id);
      socket.on('order_status_update', ({ status }: { status: string }) => {
        setOrder((prev) => prev ? { ...prev, orderStatus: status } : prev);
        toast.success(`Order ${status.replace('_', ' ')}!`);
      });
      socket.on('rider_assigned', () => fetchOrder());
    } finally {
      setLoading(false);
    }
  };

  const fetchOrder = async () => {
    try {
      const { data } = await api.get(`/orders/${id}`);
      setOrder(data);
    } catch { 
      toast.error('Order not found'); 
      navigate('/orders'); 
    }
  };

  useEffect(() => {
    return () => {
      socket.off('order_status_update');
      socket.off('rider_assigned');
    };
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  if (!order) return null;

  const currentStep = ORDER_STATUS_STEPS.findIndex((s) => s.key === order.orderStatus);

  return (
    <div className="min-h-screen bg-gray-50">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div className="bg-white border-b px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate('/orders')}><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-lg font-bold">Track Order</h1>
          <p className="text-gray-400 text-xs">#{order._id.slice(-8).toUpperCase()}</p>
        </div>
        <span className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold ${statusColor[order.orderStatus]}`}>
          {order.orderStatus.replace('_', ' ')}
        </span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* PROGRESS STEPPER */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold mb-6">Order Progress</h2>
          <div className="space-y-4">
            {ORDER_STATUS_STEPS.filter((s) => s.key !== 'cancelled').map((step, i) => {
              const done = i <= currentStep;
              const active = i === currentStep;
              return (
                <div key={step.key} className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${done ? 'gradient-primary' : 'bg-gray-100'}`}>
                    {done ? <CheckCircle className="w-4 h-4 text-white" /> : <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium text-sm ${active ? 'text-orange-500' : done ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                  </div>
                  {active && <div className="w-2 h-2 gradient-primary rounded-full animate-pulse" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIDER INFO */}
        {order.riderId && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold mb-4 flex items-center gap-2"><Bike className="w-5 h-5 text-orange-500" /> Your Rider</h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {order.riderId.name[0]}
                </div>
                <div>
                  <p className="font-semibold">{order.riderId.name}</p>
                  <p className="text-gray-400 text-sm">Delivery Rider</p>
                </div>
              </div>
              <a href={`tel:${order.riderId.phone}`} className="gradient-primary text-white p-3 rounded-full hover:opacity-90 transition">
                <Phone className="w-5 h-5" />
              </a>
            </div>
          </div>
        )}

        {/* ORDER ITEMS */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold mb-4">Order Items — {order.vendorId?.businessName}</h2>
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                {item.image && <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-gray-400 text-xs">x{item.qty}</p>
                </div>
                <span className="font-semibold text-sm">{formatNGN(item.unitPrice * item.qty)}</span>
              </div>
            ))}
          </div>
          <div className="border-t mt-4 pt-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>{formatNGN(order.subtotal)}</span></div>
            <div className="flex justify-between text-sm text-gray-500"><span>Delivery</span><span>{formatNGN(order.deliveryFee)}</span></div>
            <div className="flex justify-between font-bold text-lg"><span>Total</span><span className="text-orange-500">{formatNGN(order.totalAmount)}</span></div>
          </div>
        </div>

        {/* DELIVERY ADDRESS */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold mb-2 flex items-center gap-2"><Clock className="w-5 h-5 text-orange-500" /> Delivery Address</h2>
          <p className="text-gray-600">{order.deliveryAddress}</p>
        </div>
      </div>
    </div>
  );
}
