import { useState, useEffect } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { Spinner } from '../../../components/shared';

export default function PlatformSettings() {
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [commission, setCommission] = useState('10');
  const [supportPhone, setSupportPhone] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [deliveryFees, setDeliveryFees] = useState<{ state: string; lgas: { lga: string; fee: number }[] }[]>([]);

  useEffect(() => {
    api.get('/admin/settings').then(({ data }) => {
      setSettings(data);
      setCommission(String(data?.commissionRate || 10));
      setSupportPhone(data?.supportPhone || '');
      setSupportEmail(data?.supportEmail || '');
      setMaintenanceMode(data?.maintenanceMode || false);
      setDeliveryFees(data?.deliveryFees || []);
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/admin/settings', { commissionRate: Number(commission), supportPhone, supportEmail, maintenanceMode, deliveryFees });
      toast.success('Settings saved!');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const updateLgaFee = (stateIdx: number, lgaIdx: number, fee: number) => {
    setDeliveryFees((prev) => {
      const next = [...prev];
      next[stateIdx] = { ...next[stateIdx], lgas: next[stateIdx].lgas.map((l, i) => i === lgaIdx ? { ...l, fee } : l) };
      return next;
    });
  };

  const addLga = (stateIdx: number) => {
    const lga = prompt('New LGA name:');
    if (!lga) return;
    setDeliveryFees((prev) => {
      const next = [...prev];
      next[stateIdx] = { ...next[stateIdx], lgas: [...next[stateIdx].lgas, { lga, fee: 500 }] };
      return next;
    });
  };

  const removeLga = (stateIdx: number, lgaIdx: number) => {
    setDeliveryFees((prev) => {
      const next = [...prev];
      next[stateIdx] = { ...next[stateIdx], lgas: next[stateIdx].lgas.filter((_, i) => i !== lgaIdx) };
      return next;
    });
  };

  if (loading) return <div className="flex justify-center py-32"><Spinner size="lg" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1><p className="text-gray-500 text-sm">Configure NorthEats platform-wide settings</p></div>
        <button onClick={handleSave} disabled={saving} className="gradient-primary text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:opacity-90 disabled:opacity-60">
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* GENERAL */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">General Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Platform Commission Rate (%)</label>
              <input type="number" value={commission} onChange={(e) => setCommission(e.target.value)} min="0" max="50"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              <p className="text-gray-400 text-xs mt-1">% taken from each paid order</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Support Phone</label>
              <input value={supportPhone} onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="+234 800 000 0000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
              <input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="support@northeats.com" />
            </div>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
              <div>
                <p className="font-semibold text-gray-900 text-sm">Maintenance Mode</p>
                <p className="text-gray-400 text-xs">Disables the app for all users</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={maintenanceMode} onChange={(e) => setMaintenanceMode(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-red-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
          </div>
        </div>

        {/* DELIVERY FEES */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">Delivery Fees by LGA</h2>
          <div className="space-y-6 max-h-96 overflow-y-auto">
            {deliveryFees.map((stateObj, sIdx) => (
              <div key={stateObj.state}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-sm text-gray-800 capitalize">📍 {stateObj.state}</p>
                  <button onClick={() => addLga(sIdx)} className="text-xs text-orange-500 flex items-center gap-1 hover:underline">
                    <Plus className="w-3 h-3" /> Add LGA
                  </button>
                </div>
                <div className="space-y-2">
                  {stateObj.lgas.map((lgaObj, lIdx) => (
                    <div key={lgaObj.lga} className="flex items-center gap-3">
                      <span className="text-sm text-gray-700 flex-1">{lgaObj.lga}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 text-sm">₦</span>
                        <input type="number" value={lgaObj.fee} onChange={(e) => updateLgaFee(sIdx, lIdx, Number(e.target.value))}
                          className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400" />
                      </div>
                      <button onClick={() => removeLga(sIdx, lIdx)} className="text-gray-300 hover:text-red-500 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
