import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { Spinner } from '../../../components/shared';

export default function PendingApprovals() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/vendors', { params: { status: 'pending', limit: 50 } })
      .then(({ data }) => setVendors(data.vendors))
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id: string) => {
    await api.patch(`/admin/vendors/${id}/approve`);
    setVendors((p) => p.filter((v) => v._id !== id));
    toast.success('Vendor approved!');
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Rejection reason (will be shown to vendor):');
    if (!reason) return;
    await api.patch(`/admin/vendors/${id}/suspend`, { reason });
    setVendors((p) => p.filter((v) => v._id !== id));
    toast.success('Vendor rejected');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Pending Approvals</h1>
      <p className="text-gray-500 text-sm mb-6">{vendors.length} vendor{vendors.length !== 1 ? 's' : ''} awaiting review</p>

      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : vendors.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm">
          <CheckCircle className="w-16 h-16 text-green-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">All caught up! No pending approvals.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map((vendor) => {
            const user = vendor.userId as Record<string, unknown>;
            return (
              <div key={vendor._id as string} className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {(vendor.businessName as string)[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{vendor.businessName as string}</p>
                    <p className="text-gray-400 text-xs capitalize">{vendor.state as string} · {vendor.lga as string}</p>
                    <p className="text-gray-400 text-xs">{user?.email as string}</p>
                  </div>
                </div>
                <p className="text-gray-500 text-sm mb-4">{(vendor.description as string) || 'No description provided'}</p>
                <p className="text-gray-400 text-xs mb-4">Applied: {new Date(vendor.createdAt as string).toLocaleDateString()}</p>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(vendor._id as string)}
                    className="flex-1 bg-green-500 text-white py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1 hover:bg-green-600 transition">
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button onClick={() => handleReject(vendor._id as string)}
                    className="flex-1 bg-red-100 text-red-600 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1 hover:bg-red-200 transition">
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                  <button onClick={() => navigate(`/admin/vendors/${vendor._id}`)}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition">
                    View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
