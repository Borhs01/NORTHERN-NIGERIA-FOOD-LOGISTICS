import { useState, useEffect } from 'react';
import { Download, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { formatNGN, statusColor } from '../../../utils/constants';
import { Spinner } from '../../../components/shared';

export default function Transactions() {
  const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [grossRevenue, setGrossRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ state: '', status: '', from: '', to: '', page: 1 });

  useEffect(() => { fetchPayments(); }, [filters.state, filters.status, filters.page]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/payments', { params: { ...filters, limit: 20 } });
      setOrders(data.orders);
      setTotal(data.total);
      setGrossRevenue(data.grossRevenue);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const handleExport = () => { window.open('/api/admin/payments/export', '_blank'); };
  const setFilter = (k: string, v: string) => setFilters((p) => ({ ...p, [k]: v, page: 1 }));

  const commission = grossRevenue * 0.1;
  const net = grossRevenue - commission;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Payments & Transactions</h1><p className="text-gray-500 text-sm">{total} transactions</p></div>
        <button onClick={handleExport} className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm hover:bg-gray-50 transition">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* REVENUE SUMMARY */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Gross Revenue', value: formatNGN(grossRevenue), color: 'text-green-500', bg: 'bg-green-50' },
          { label: 'Platform Commission (10%)', value: formatNGN(commission), color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Paystack Fees (est. 1.5%)', value: formatNGN(grossRevenue * 0.015), color: 'text-orange-500', bg: 'bg-orange-50' },
          { label: 'Net Payout to Vendors', value: formatNGN(net * 0.985), color: 'text-purple-500', bg: 'bg-purple-50' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className={`w-9 h-9 ${s.bg} ${s.color} rounded-xl flex items-center justify-center mb-2`}><DollarSign className="w-5 h-5" /></div>
            <p className="font-bold text-gray-900 text-lg">{s.value}</p>
            <p className="text-gray-400 text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-6 flex flex-wrap gap-3">
        {[
          { key: 'state', options: [['', 'All States'], ['plateau', 'Plateau'], ['bauchi', 'Bauchi'], ['kaduna', 'Kaduna']] },
          { key: 'status', options: [['', 'All'], ['paid', 'Paid'], ['refunded', 'Refunded'], ['failed', 'Failed']] },
        ].map((f) => (
          <select key={f.key} value={filters[f.key as keyof typeof filters]} onChange={(e) => setFilter(f.key, e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
            {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ))}
        <input type="date" value={filters.from} onChange={(e) => setFilter('from', e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
        <input type="date" value={filters.to} onChange={(e) => setFilter('to', e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? <div className="flex justify-center py-20"><Spinner /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>{['Reference', 'Consumer', 'Vendor', 'Amount', 'Delivery Fee', 'Channel', 'Status', 'State', 'Date'].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((o) => {
                  const consumer = o.consumerId as Record<string, unknown>;
                  const vendor = o.vendorId as Record<string, unknown>;
                  return (
                    <tr key={o._id as string} className="hover:bg-gray-50 transition">
                      <td className="px-3 py-3 text-xs text-gray-400 font-mono">{(o.paymentRef as string)?.slice(-12) || '—'}</td>
                      <td className="px-3 py-3 text-sm text-gray-800">{consumer?.name as string}</td>
                      <td className="px-3 py-3 text-sm text-gray-600">{vendor?.businessName as string}</td>
                      <td className="px-3 py-3 text-sm font-bold text-orange-500">{formatNGN(o.totalAmount as number)}</td>
                      <td className="px-3 py-3 text-sm text-gray-500">{formatNGN(o.deliveryFee as number)}</td>
                      <td className="px-3 py-3 text-sm text-gray-500 capitalize">{(o.paymentChannel as string) || '—'}</td>
                      <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor[o.paymentStatus as string]}`}>{o.paymentStatus as string}</span></td>
                      <td className="px-3 py-3 text-sm text-gray-500 capitalize">{o.state as string}</td>
                      <td className="px-3 py-3 text-xs text-gray-400">{new Date(o.createdAt as string).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="p-4 border-t flex items-center justify-between text-sm text-gray-500">
          <span>{total} transactions</span>
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
