import { useState, useEffect } from 'react';
import { Search, Pause, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { formatNGN } from '../../../utils/constants';
import { Spinner } from '../../../components/shared';

export default function ConsumerList() {
  const [consumers, setConsumers] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => { fetchConsumers(); }, [page]);

  const fetchConsumers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/consumers', { params: { search, page, limit: 20 } });
      setConsumers(data.consumers);
      setTotal(data.total);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const handleSuspend = async (id: string, suspended: boolean) => {
    if (suspended) {
      await api.patch(`/admin/consumers/${id}/unsuspend`);
      toast.success('Unsuspended');
    } else {
      const reason = prompt('Reason:');
      if (!reason) return;
      await api.patch(`/admin/consumers/${id}/suspend`, { reason });
      toast.success('Suspended');
    }
    fetchConsumers();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Consumers</h1><p className="text-gray-500 text-sm">{total} registered consumers</p></div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm mb-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchConsumers()}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="Search by name or email..." />
        </div>
        <button onClick={fetchConsumers} className="gradient-primary text-white px-4 py-2 rounded-xl text-sm font-semibold">Search</button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? <div className="flex justify-center py-20"><Spinner /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>{['Consumer', 'State', 'Total Orders', 'Total Spent', 'Status', 'Joined', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {consumers.map((c) => (
                  <tr key={c._id as string} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-sm text-gray-900">{c.name as string}</p>
                      <p className="text-gray-400 text-xs">{(c.email as string) || (c.phone as string)}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">{(c.state as string) || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{(c.totalOrders as number) || 0}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-orange-500">{formatNGN((c.totalSpent as number) || 0)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.isSuspended ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {c.isSuspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{new Date(c.createdAt as string).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleSuspend(c._id as string, c.isSuspended as boolean)}
                        className={`p-1.5 rounded-lg transition ${c.isSuspended ? 'text-green-500 hover:bg-green-50' : 'text-red-500 hover:bg-red-50'}`}>
                        {c.isSuspended ? <CheckCircle className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="p-4 border-t flex items-center justify-between text-sm text-gray-500">
          <span>Showing {consumers.length} of {total}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-50">Prev</button>
            <span className="px-3 py-1.5">{page}</span>
            <button disabled={consumers.length < 20} onClick={() => setPage(page + 1)} className="px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
