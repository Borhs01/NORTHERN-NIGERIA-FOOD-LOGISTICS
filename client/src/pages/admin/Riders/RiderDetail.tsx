import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Pause, XCircle, Bike, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { formatNGN } from '../../../utils/constants';
import { Spinner } from '../../../components/shared';

export default function RiderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rider, setRider] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/riders', { params: { limit: 200 } }).then(({ data }) => {
      const found = (data.riders as Record<string, unknown>[]).find((r) => r._id === id);
      if (found) setRider(found);
    }).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-32"><Spinner size="lg" /></div>;
  if (!rider) return <div className="text-center py-20 text-gray-500">Rider not found</div>;

  const user = rider.userId as Record<string, unknown>;
  const badge = rider.isSuspended ? { label: 'Suspended', cls: 'bg-red-100 text-red-700' }
    : rider.isApproved ? { label: 'Approved', cls: 'bg-green-100 text-green-700' }
    : { label: 'Pending', cls: 'bg-yellow-100 text-yellow-700' };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/riders')} className="p-2 hover:bg-gray-100 rounded-xl"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{user?.name as string}</h1>
          <p className="text-gray-500 text-sm capitalize">{rider.vehicleType as string} · {rider.state as string} · {rider.lga as string}</p>
        </div>
        <span className={`ml-auto px-3 py-1 rounded-full text-sm font-semibold ${badge.cls}`}>{badge.label}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
              {(user?.name as string)?.[0]}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg">{user?.name as string}</p>
              <p className="text-gray-400 text-sm">{user?.phone as string}</p>
              <p className="text-gray-400 text-sm">{user?.email as string}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { icon: <Bike className="w-5 h-5" />, label: 'Deliveries', value: (rider.totalDeliveries as number) || 0 },
              { icon: <DollarSign className="w-5 h-5" />, label: 'Earnings', value: formatNGN((rider.totalEarnings as number) || 0) },
            ].map((s) => (
              <div key={s.label} className="p-3 bg-gray-50 rounded-xl text-center">
                <div className="flex justify-center text-orange-500 mb-1">{s.icon}</div>
                <p className="font-bold text-gray-900">{s.value}</p>
                <p className="text-gray-400 text-xs">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            {!rider.isApproved && (
              <button onClick={async () => { await api.patch(`/admin/riders/${id}/approve`); setRider((p) => p ? { ...p, isApproved: true } : p); toast.success('Approved!'); }}
                className="flex-1 bg-green-500 text-white py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1">
                <CheckCircle className="w-4 h-4" /> Approve
              </button>
            )}
            {!rider.isSuspended && (
              <button onClick={async () => { const r = prompt('Reason:'); if (!r) return; await api.patch(`/admin/riders/${id}/suspend`, { reason: r }); setRider((p) => p ? { ...p, isSuspended: true } : p); toast.success('Suspended'); }}
                className="flex-1 bg-red-100 text-red-600 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1">
                <Pause className="w-4 h-4" /> Suspend
              </button>
            )}
            {rider.isSuspended && (
              <button onClick={async () => { await api.patch(`/admin/riders/${id}/unsuspend`); setRider((p) => p ? { ...p, isSuspended: false } : p); toast.success('Unsuspended!'); }}
                className="flex-1 bg-blue-500 text-white py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1">
                <XCircle className="w-4 h-4" /> Unsuspend
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">Details</h2>
          <div className="space-y-3 text-sm">
            {[
              { label: 'Vehicle Type', value: (rider.vehicleType as string)?.charAt(0).toUpperCase() + (rider.vehicleType as string)?.slice(1) },
              { label: 'State', value: (rider.state as string)?.charAt(0).toUpperCase() + (rider.state as string)?.slice(1) },
              { label: 'LGA', value: rider.lga as string },
              { label: 'Online Status', value: rider.isOnline ? '🟢 Online' : '⚫ Offline' },
              { label: 'Avg Rating', value: (rider.averageRating as number) ? `⭐ ${rider.averageRating}` : 'No ratings yet' },
              { label: 'Bank Name', value: (rider.bankName as string) || '—' },
              { label: 'Account Number', value: (rider.accountNumber as string) || '—' },
              { label: 'Registered', value: new Date(rider.createdAt as string).toLocaleDateString() },
            ].map((row) => (
              <div key={row.label} className="flex justify-between">
                <span className="text-gray-400">{row.label}</span>
                <span className="font-medium text-gray-800">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
