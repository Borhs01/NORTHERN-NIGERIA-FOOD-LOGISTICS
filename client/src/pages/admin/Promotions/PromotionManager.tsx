import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { Spinner } from '../../../components/shared';

interface Promo { _id: string; title: string; description: string; image: string; discountType: string; discountValue: number; promoCode: string; targetStates: string[]; validFrom: string; validUntil: string; isActive: boolean; }

export default function PromotionManager() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Promo | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', discountType: 'percentage', discountValue: '10',
    promoCode: '', targetStates: [] as string[], validUntil: '', isActive: true,
  });

  useEffect(() => { api.get('/admin/promotions').then(({ data }) => setPromos(data)).finally(() => setLoading(false)); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ title: '', description: '', discountType: 'percentage', discountValue: '10', promoCode: '', targetStates: [], validUntil: '', isActive: true });
    setImageFile(null);
    setShowModal(true);
  };

  const openEdit = (p: Promo) => {
    setEditing(p);
    setForm({ title: p.title, description: p.description, discountType: p.discountType, discountValue: String(p.discountValue), promoCode: p.promoCode, targetStates: p.targetStates, validUntil: p.validUntil?.slice(0, 10), isActive: p.isActive });
    setImageFile(null);
    setShowModal(true);
  };

  const toggleState = (s: string) => setForm((p) => ({
    ...p,
    targetStates: p.targetStates.includes(s) ? p.targetStates.filter((x) => x !== s) : [...p.targetStates, s],
  }));

  const handleSave = async () => {
    if (!form.title || !form.validUntil) return toast.error('Title and end date are required');
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'targetStates') (v as string[]).forEach((s) => fd.append('targetStates[]', s));
        else fd.append(k, String(v));
      });
      if (imageFile) fd.append('image', imageFile);
      if (editing) {
        const { data } = await api.patch(`/admin/promotions/${editing._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setPromos((p) => p.map((x) => x._id === editing._id ? data : x));
        toast.success('Promotion updated');
      } else {
        const { data } = await api.post('/admin/promotions', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setPromos((p) => [data, ...p]);
        toast.success('Promotion created');
      }
      setShowModal(false);
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this promotion?')) return;
    await api.delete(`/admin/promotions/${id}`);
    setPromos((p) => p.filter((x) => x._id !== id));
    toast.success('Deleted');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Promotions</h1><p className="text-gray-500 text-sm">{promos.length} promotions</p></div>
        <button onClick={openAdd} className="gradient-primary text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Promotion
        </button>
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : promos.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm">
          <p className="text-gray-400 mb-4">No promotions yet</p>
          <button onClick={openAdd} className="gradient-primary text-white px-6 py-3 rounded-xl font-semibold">Create First Promotion</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {promos.map((promo) => (
            <div key={promo._id} className={`bg-white rounded-2xl overflow-hidden shadow-sm ${!promo.isActive ? 'opacity-60' : ''}`}>
              {promo.image && <img src={promo.image} alt="" className="w-full h-36 object-cover" />}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-900 flex-1">{promo.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ml-2 ${promo.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {promo.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mb-3 line-clamp-2">{promo.description}</p>
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-3 flex-wrap">
                  <span className="gradient-primary text-white px-2 py-0.5 rounded-full font-semibold">
                    {promo.discountType === 'percentage' ? `${promo.discountValue}% OFF` : `₦${promo.discountValue} OFF`}
                  </span>
                  {promo.promoCode && <span className="bg-gray-100 font-mono px-2 py-0.5 rounded">{promo.promoCode}</span>}
                  {promo.targetStates.map((s) => <span key={s} className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded capitalize">{s}</span>)}
                </div>
                <p className="text-xs text-gray-400 mb-3">Valid until: {new Date(promo.validUntil).toLocaleDateString()}</p>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(promo)} className="flex-1 border border-gray-200 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => handleDelete(promo._id)} className="flex-1 bg-red-50 text-red-500 py-2 rounded-xl text-xs font-semibold hover:bg-red-100 flex items-center justify-center gap-1">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg">{editing ? 'Edit Promotion' : 'New Promotion'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image</label>
                <label className="block w-full border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-orange-300 transition">
                  {imageFile ? <img src={URL.createObjectURL(imageFile)} alt="" className="w-full h-28 object-cover rounded-lg" />
                    : editing?.image ? <img src={editing.image} alt="" className="w-full h-28 object-cover rounded-lg" />
                    : <div className="py-3"><Upload className="w-6 h-6 text-gray-300 mx-auto mb-1" /><p className="text-gray-400 text-sm">Upload image</p></div>}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                </label>
              </div>
              {[
                { label: 'Title *', key: 'title', placeholder: 'e.g. Weekend Discount' },
                { label: 'Description', key: 'description', placeholder: 'Promotion details...' },
                { label: 'Promo Code (optional)', key: 'promoCode', placeholder: 'NORTH10' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input value={form[f.key as keyof typeof form] as string} onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder={f.placeholder} />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                  <select value={form.discountType} onChange={(e) => setForm((p) => ({ ...p, discountType: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none">
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat (₦)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
                  <input type="number" value={form.discountValue} onChange={(e) => setForm((p) => ({ ...p, discountValue: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none" placeholder="10" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target States</label>
                <div className="flex gap-2">
                  {['plateau', 'bauchi', 'kaduna'].map((s) => (
                    <button key={s} onClick={() => toggleState(s)} type="button"
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium capitalize transition ${form.targetStates.includes(s) ? 'gradient-primary text-white' : 'border border-gray-200 text-gray-600'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until *</label>
                <input type="date" value={form.validUntil} onChange={(e) => setForm((p) => ({ ...p, validUntil: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 accent-orange-500" />
                <span className="text-sm text-gray-700">Active (visible to users)</span>
              </label>
              <button onClick={handleSave} disabled={saving} className="w-full gradient-primary text-white py-3 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-60">
                {saving ? 'Saving...' : editing ? 'Update Promotion' : 'Create Promotion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
