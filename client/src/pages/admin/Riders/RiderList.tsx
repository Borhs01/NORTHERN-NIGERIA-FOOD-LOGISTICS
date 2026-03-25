import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Pause } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { Spinner } from '../../../components/shared';

export default function RiderList() {
  const navigate = useNavigate();
  const [riders, setRiders] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [state, setState] = useState('');

  useEffect(() => { fetchRiders(); }, [status, state]);

  const fetchRiders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/riders', { params: { status, state } });
      setRiders(data.riders);
      setTotal(data.total);
    } catch { toast.error('Failed to load riders'); }
    finally { setLoading(false); }
  };

  const handleApprove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await api.patch(`/admin/riders/${id}/approve`);
    toast.success('Rider approved');
    fetchRiders();
  };

  const handleSuspend = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const reason = prompt('Suspension reason:');
    if (reason === null) return;
    await api.patch(`/admin/riders/${id}/suspend`, { reason });
    toast.success('Rider suspended');
    fetchRiders();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Riders</h1>
          <p className="text-gray-500 text-sm">{total} total riders</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm mb-6 flex gap-3 flex-wrap">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="suspended">Suspended</option>
        </select>
        <select value={state} onChange={(e) => setState(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
          <option value="">All States</option>
          <option value="plateau">Plateau</option>
          <option value="bauchi">Bauchi</option>
          <option value="kaduna">Kaduna</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? <div className="flex justify-center py-20"><Spinner /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>{['Rider', 'State / LGA', 'Vehicle', 'Status', 'Online', 'Deliveries', 'Rating', 'Joined', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {riders.map((r) => {
                  const user = r.userId as Record<string, unknown>;
                  const badge = r.isSuspended ? { label: 'Suspended', cls: 'bg-red-100 text-red-700' }
                    : r.isApproved ? { label: 'Approved', cls: 'bg-green-100 text-green-700' }
                    : { label: 'Pending', cls: 'bg-yellow-100 text-yellow-700' };
                  return (
                    <tr key={r._id as string} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => navigate(`/admin/riders/${r._id}`)}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-sm text-gray-900">{user?.name as string}</p>
                        <p className="text-gray-400 text-xs">{user?.phone as string}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 capitalize">{r.state as string} · {r.lga as string}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 capitalize">{r.vehicleType as string}</td>
                      <td className="px-4 py-3"><span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.cls}`}>{badge.label}</span></td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{r.isOnline ? 'Online' : 'Offline'}</span></td>
                      <td className="px-4 py-3 text-sm text-gray-600">{(r.totalDeliveries as number) || 0}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">⭐ {(r.averageRating as number) || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{new Date(r.createdAt as string).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {!r.isApproved && <button onClick={(e) => handleApprove(r._id as string, e)} className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg"><CheckCircle className="w-4 h-4" /></button>}
                          {!r.isSuspended && <button onClick={(e) => handleSuspend(r._id as string, e)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Pause className="w-4 h-4" /></button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
