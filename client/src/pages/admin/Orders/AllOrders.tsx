import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { formatNGN, statusColor } from '../../../utils/constants';
import { Spinner } from '../../../components/shared';

export default function AllOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ state: '', status: '', paymentStatus: '', from: '', to: '', page: 1 });

  useEffect(() => { fetchOrders(); }, [filters.state, filters.status, filters.paymentStatus, filters.page]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/orders', { params: { ...filters, limit: 20 } });
      setOrders(data.orders);
      setTotal(data.total);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const setFilter = (k: string, v: string) => setFilters((p) => ({ ...p, [k]: v, page: 1 }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">All Orders</h1><p className="text-gray-500 text-sm">{total} orders total</p></div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm mb-6 flex flex-wrap gap-3">
        {[
          { key: 'state', options: [['', 'All States'], ['plateau', 'Plateau'], ['bauchi', 'Bauchi'], ['kaduna', 'Kaduna']] },
          { key: 'status', options: [['', 'All Status'], ['pending', 'Pending'], ['confirmed', 'Confirmed'], ['preparing', 'Preparing'], ['ready', 'Ready'], ['picked_up', 'Picked Up'], ['delivered', 'Delivered'], ['cancelled', 'Cancelled']] },
          { key: 'paymentStatus', options: [['', 'All Payment'], ['pending', 'Unpaid'], ['paid', 'Paid'], ['refunded', 'Refunded']] },
        ].map((f) => (
          <select key={f.key} value={filters[f.key as keyof typeof filters]} onChange={(e) => setFilter(f.key, e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
            {f.options.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
          </select>
        ))}
        <input type="date" value={filters.from} onChange={(e) => setFilter('from', e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
        <input type="date" value={filters.to} onChange={(e) => setFilter('to', e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? <div className="flex justify-center py-20"><Spinner /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>{['Order ID', 'Consumer', 'Vendor', 'Rider', 'State', 'Amount', 'Payment', 'Status', 'Date'].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((o) => {
                  const consumer = o.consumerId as Record<string, unknown>;
                  const vendor = o.vendorId as Record<string, unknown>;
                  const rider = o.riderId as Record<string, unknown> | null;
                  return (
                    <tr key={o._id as string} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => navigate(`/admin/orders/${o._id}`)}>
                      <td className="px-3 py-3 text-xs text-gray-400 font-mono">#{(o._id as string).slice(-6).toUpperCase()}</td>
                      <td className="px-3 py-3 text-sm text-gray-800">{consumer?.name as string}</td>
                      <td className="px-3 py-3 text-sm text-gray-600">{vendor?.businessName as string}</td>
                      <td className="px-3 py-3 text-sm text-gray-500">{(rider?.name as string) || '—'}</td>
                      <td className="px-3 py-3 text-sm text-gray-500 capitalize">{o.state as string}</td>
                      <td className="px-3 py-3 text-sm font-bold text-orange-500">{formatNGN(o.totalAmount as number)}</td>
                      <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor[o.paymentStatus as string]}`}>{o.paymentStatus as string}</span></td>
                      <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor[o.orderStatus as string]}`}>{(o.orderStatus as string)?.replace('_', ' ')}</span></td>
                      <td className="px-3 py-3 text-xs text-gray-400">{new Date(o.createdAt as string).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="p-4 border-t flex items-center justify-between text-sm text-gray-500">
          <span>{total} total</span>
          <div className="flex gap-2">
            <button disabled={filters.page === 1} onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))} className="px-3 py-1.5 border rounded-lg disabled:opacity-40">Prev</button>
            <span className="px-3 py-1.5">{filters.page}</span>
            <button disabled={orders.length < 20} onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))} className="px-3 py-1.5 border rounded-lg disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
