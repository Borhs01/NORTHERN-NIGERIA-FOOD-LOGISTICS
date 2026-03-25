import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, CheckCircle, XCircle, Pause } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { Spinner } from '../../../components/shared';

export default function VendorList() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [state, setState] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => { fetchVendors(); }, [status, state, page]);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/vendors', { params: { status, state, search, page, limit: 20 } });
      setVendors(data.vendors);
      setTotal(data.total);
    } catch { toast.error('Failed to load vendors'); }
    finally { setLoading(false); }
  };

  const handleApprove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await api.patch(`/admin/vendors/${id}/approve`);
    toast.success('Vendor approved');
    fetchVendors();
  };

  const handleSuspend = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const reason = prompt('Reason for suspension:');
    if (reason === null) return;
    await api.patch(`/admin/vendors/${id}/suspend`, { reason });
    toast.success('Vendor suspended');
    fetchVendors();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-500 text-sm">{total} total vendors</p>
        </div>
        <button onClick={() => navigate('/admin/vendors/pending')}
          className="gradient-primary text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
          Pending Approvals <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchVendors()}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="Search vendors..." />
        </div>
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

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? <div className="flex justify-center py-20"><Spinner /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Business', 'State / LGA', 'Rating', 'Orders', 'Status', 'Joined', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {vendors.map((v) => {
                  const user = v.userId as Record<string, unknown>;
                  const isSuspended = Boolean(v.isSuspended);
                  const isApproved = Boolean(v.isApproved);
                  const badge = isSuspended ? { label: 'Suspended', cls: 'bg-red-100 text-red-700' }
                    : isApproved ? { label: 'Approved', cls: 'bg-green-100 text-green-700' }
                    : { label: 'Pending', cls: 'bg-yellow-100 text-yellow-700' };
                  return (
                    <tr key={v._id as string} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => navigate(`/admin/vendors/${v._id}`)}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-sm text-gray-900">{v.businessName as string}</p>
                        <p className="text-gray-400 text-xs">{user?.email as string}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 capitalize">{v.state as string} · {v.lga as string}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">⭐ {(v.averageRating as number) || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{(v.totalOrders as number) || 0}</td>
                      <td className="px-4 py-3"><span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.cls}`}>{badge.label}</span></td>
                      <td className="px-4 py-3 text-xs text-gray-400">{new Date(v.createdAt as string).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {!v.isApproved && !v.isSuspended && (
                            <button onClick={(e) => handleApprove(v._id as string, e)} title="Approve"
                              className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition"><CheckCircle className="w-4 h-4" /></button>
                          )}
                          {!v.isSuspended && (
                            <button onClick={(e) => handleSuspend(v._id as string, e)} title="Suspend"
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"><Pause className="w-4 h-4" /></button>
                          )}
                          {v.isSuspended && (
                            <button onClick={async (e) => { e.stopPropagation(); await api.patch(`/admin/vendors/${v._id}/unsuspend`); toast.success('Unsuspended'); fetchVendors(); }}
                              title="Unsuspend" className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition"><XCircle className="w-4 h-4" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {/* PAGINATION */}
        <div className="p-4 border-t flex items-center justify-between text-sm text-gray-500">
          <span>Showing {vendors.length} of {total}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">Prev</button>
            <span className="px-3 py-1.5">{page}</span>
            <button disabled={vendors.length < 20} onClick={() => setPage(page + 1)} className="px-3 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
