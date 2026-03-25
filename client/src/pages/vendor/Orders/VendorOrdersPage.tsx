import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../../../services/api';
import { formatNGN, statusColor } from '../../../utils/constants';
import { Spinner } from '../../../components/shared';

export default function VendorOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/orders/vendor/me').then(({ data }) => setOrders(data)).finally(() => setLoading(false)); }, []);

  const updateStatus = async (id: string, status: string) => {
    await api.patch(`/orders/${id}/status`, { status });
    setOrders((p) => p.map((o) => o._id === id ? { ...o, orderStatus: status } : o));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div className="bg-white border-b px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate('/vendor/dashboard')}><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-bold">All Orders</h1>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? <div className="flex justify-center py-20"><Spinner /></div> : (
          <div className="space-y-4">
            {orders.map((order) => {
              const items = order.items as { name: string; qty: number }[];
              const consumer = order.consumerId as Record<string, unknown>;
              const status = order.orderStatus as string;
              return (
                <div key={order._id as string} className="bg-white rounded-2xl p-5 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-gray-900">{consumer?.name as string} · <span className="font-mono text-gray-400 text-sm">#{(order._id as string).slice(-6).toUpperCase()}</span></p>
                      <p className="text-gray-500 text-sm">{items?.map((i) => `${i.name} x${i.qty}`).join(' · ')}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor[status]}`}>{status.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-orange-500 font-bold">{formatNGN(order.totalAmount as number)}</span>
                    <div className="flex gap-2">
                      {status === 'pending' && (
                        <>
                          <button onClick={() => updateStatus(order._id as string, 'confirmed')} className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg font-semibold">Confirm</button>
                          <button onClick={() => updateStatus(order._id as string, 'cancelled')} className="text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded-lg font-semibold">Cancel</button>
                        </>
                      )}
                      {status === 'confirmed' && <button onClick={() => updateStatus(order._id as string, 'preparing')} className="text-xs gradient-primary text-white px-3 py-1.5 rounded-lg font-semibold">Start Preparing</button>}
                      {status === 'preparing' && <button onClick={() => updateStatus(order._id as string, 'ready')} className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-lg font-semibold">Mark Ready</button>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
