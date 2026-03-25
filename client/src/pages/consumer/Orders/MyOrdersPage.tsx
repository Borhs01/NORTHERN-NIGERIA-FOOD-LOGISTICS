import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, MapPin } from 'lucide-react';
import api from '../../../services/api';
import { formatNGN, statusColor } from '../../../utils/constants';
import { Spinner } from '../../../components/shared';

export default function MyOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/consumer/me').then(({ data }) => setOrders(data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div className="bg-white border-b px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate('/home')}><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-bold">My Orders</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : orders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No orders yet</p>
            <button onClick={() => navigate('/home')} className="mt-4 gradient-primary text-white px-6 py-3 rounded-xl font-semibold">
              Order Food
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: Record<string, unknown>) => {
              const vendor = order.vendorId as Record<string, unknown>;
              const items = order.items as { name: string; qty: number }[];
              return (
                <div key={order._id as string}
                  className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-gray-900">{vendor?.businessName as string}</p>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor[order.orderStatus as string]}`}>
                      {(order.orderStatus as string).replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm">{items?.map((i) => `${i.name} x${i.qty}`).join(', ')}</p>
                  <div className="flex items-center justify-between mt-3 mb-3">
                    <span className="text-orange-500 font-bold">{formatNGN(order.totalAmount as number)}</span>
                    <span className="text-gray-400 text-xs">{new Date(order.createdAt as string).toLocaleDateString()}</span>
                  </div>
                  <button 
                    onClick={() => navigate(`/orders/${order._id}`)}
                    className="w-full gradient-primary text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition">
                    <MapPin className="w-4 h-4" /> Track Order
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
