import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { formatNGN } from '../../../utils/constants';
import { Spinner } from '../../../components/shared';

interface FoodItem { _id: string; name: string; description: string; price: number; image: string; category: string; isAvailable: boolean; isPopular: boolean; }

export default function VendorMenuManager() {
  const navigate = useNavigate();
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<FoodItem | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', category: '', isAvailable: true, isPopular: false });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      const meRes = await api.get('/auth/me');
      const vendorId = meRes.data.profile?._id;
      if (vendorId) {
        const { data } = await api.get(`/items/vendor/${vendorId}`);
        setItems(data);
      }
    } catch { toast.error('Failed to load menu'); }
    finally { setLoading(false); }
  };

  const openAdd = () => { setEditing(null); setForm({ name: '', description: '', price: '', category: '', isAvailable: true, isPopular: false }); setImageFile(null); setShowModal(true); };
  const openEdit = (item: FoodItem) => { setEditing(item); setForm({ name: item.name, description: item.description, price: String(item.price), category: item.category, isAvailable: item.isAvailable, isPopular: item.isPopular }); setImageFile(null); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.category) return toast.error('Fill required fields');
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      if (imageFile) fd.append('image', imageFile);

      if (editing) {
        const { data } = await api.patch(`/items/${editing._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setItems((p) => p.map((i) => i._id === editing._id ? data : i));
        toast.success('Item updated');
      } else {
        const { data } = await api.post('/items', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setItems((p) => [...p, data]);
        toast.success('Item added');
      }
      setShowModal(false);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; code?: string } } };
      const message = error.response?.data?.message || 'Failed to save item';
      if (error.response?.data?.code === 'NO_VENDOR_PROFILE') {
        toast.error('Please complete your vendor profile first');
      } else {
        toast.error(message);
      }
    }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    try {
      await api.delete(`/items/${id}`);
      setItems((p) => p.filter((i) => i._id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const categories = [...new Set(items.map((i) => i.category))];

  return (
    <div className="min-h-screen bg-gray-50">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <div className="bg-white border-b px-4 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/vendor/dashboard')}><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-lg font-bold">Menu Manager</h1>
        </div>
        <button onClick={openAdd} className="gradient-primary text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 mb-4">No menu items yet</p>
            <button onClick={openAdd} className="gradient-primary text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 mx-auto">
              <Plus className="w-4 h-4" /> Add Your First Item
            </button>
          </div>
        ) : (
          categories.length > 0 ? categories.map((cat) => (
            <div key={cat} className="mb-8">
              <h2 className="font-bold text-gray-700 uppercase text-xs tracking-wide mb-3">{cat}</h2>
              <div className="space-y-3">
                {items.filter((i) => i.category === cat).map((item) => (
                  <div key={item._id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
                    {item.image ? <img src={item.image} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" /> : (
                      <div className="w-16 h-16 bg-gray-100 rounded-xl shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                        {item.isPopular && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">Popular</span>}
                        {!item.isAvailable && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Unavailable</span>}
                      </div>
                      <p className="text-gray-400 text-sm truncate">{item.description}</p>
                      <p className="text-orange-500 font-bold mt-1">{formatNGN(item.price)}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => openEdit(item)} className="p-2 text-gray-400 hover:text-blue-500 transition rounded-lg hover:bg-blue-50"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(item._id)} className="p-2 text-gray-400 hover:text-red-500 transition rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )) : <p className="text-gray-400">No items</p>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg">{editing ? 'Edit Item' : 'Add New Item'}</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Food Image</label>
                <label className="block w-full border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-orange-300 transition">
                  {imageFile ? (
                    <img src={URL.createObjectURL(imageFile)} alt="" className="w-full h-32 object-cover rounded-lg" />
                  ) : editing?.image ? (
                    <img src={editing.image} alt="" className="w-full h-32 object-cover rounded-lg" />
                  ) : (
                    <div className="py-4"><Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" /><p className="text-gray-400 text-sm">Click to upload image</p></div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                </label>
              </div>
              {[
                { label: 'Item Name *', key: 'name', placeholder: 'e.g. Suya Plate' },
                { label: 'Category *', key: 'category', placeholder: 'e.g. Grills & Suya' },
                { label: 'Price (₦) *', key: 'price', placeholder: '2500', type: 'number' },
                { label: 'Description', key: 'description', placeholder: 'Brief description of the dish' },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  <input type={field.type || 'text'} value={form[field.key as keyof typeof form] as string} onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm" placeholder={field.placeholder} />
                </div>
              ))}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm((p) => ({ ...p, isAvailable: e.target.checked }))} className="w-4 h-4 accent-orange-500" />
                  <span className="text-sm text-gray-700">Available</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isPopular} onChange={(e) => setForm((p) => ({ ...p, isPopular: e.target.checked }))} className="w-4 h-4 accent-orange-500" />
                  <span className="text-sm text-gray-700">Mark as Popular</span>
                </label>
              </div>
              <button onClick={handleSave} disabled={saving} className="w-full gradient-primary text-white py-3 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-60 mt-2">
                {saving ? 'Saving...' : editing ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
