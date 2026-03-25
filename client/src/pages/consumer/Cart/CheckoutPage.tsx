import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../services/api';
import { useCartStore } from '../../../store/cartStore';
import { useAuthStore } from '../../../store/authStore';
import { formatNGN, STATES } from '../../../utils/constants';
import AddressInput from '../../../components/shared/AddressInput';
import type { DetailedAddressData } from '../../../utils/geolocation';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, vendorId, vendorName, total, deliveryFee, clearCart } = useCartStore();
  const [addressData, setAddressData] = useState<Partial<DetailedAddressData>>({
    houseNumber: user?.houseNumber || '',
    streetName: user?.streetName || '',
    buildingName: user?.buildingName || '',
    landmark: user?.landmark || '',
    area: user?.area || '',
    state: user?.state || 'plateau',
    lga: user?.lga || STATES['plateau'].lgas[0],
    fullAddress: user?.address || '',
  });
  const [loading, setLoading] = useState(false);
  const subtotal = total();
  const grandTotal = subtotal + deliveryFee;

  const placeOrder = async () => {
    if (!addressData.fullAddress?.trim()) return toast.error('Please enter your delivery address');
    if (!addressData.state || !addressData.lga) return toast.error('Please select your State and LGA');
    if (!items.length) return toast.error('Your cart is empty');
    setLoading(true);
    try {
      const orderPayload = {
        vendorId,
        state: addressData.state,
        deliveryAddress: addressData.fullAddress,
        deliveryLga: addressData.lga,
        deliveryAddressDetails: {
          houseNumber: addressData.houseNumber,
          streetName: addressData.streetName,
          buildingName: addressData.buildingName,
          landmark: addressData.landmark,
          area: addressData.area,
          lat: addressData.lat,
          lng: addressData.lng,
        },
        items: items.map((i) => ({ foodItemId: i._id, name: i.name, qty: i.qty, unitPrice: i.price, image: i.image })),
      };
      const { data: order } = await api.post('/orders', orderPayload);
      const { data: payment } = await api.post('/payments/initiate', { orderId: order._id });

      // Store reference in sessionStorage as backup for payment verification
      sessionStorage.setItem('paymentReference', payment.reference);
      sessionStorage.setItem('orderId', order._id);

      clearCart();
      window.location.href = payment.authorizationUrl;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (!items.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center flex-col gap-4">
        <ShoppingCart className="w-16 h-16 text-gray-200" />
        <p className="text-gray-500 text-lg font-medium">Your cart is empty</p>
        <button onClick={() => navigate('/home')} className="gradient-primary text-white px-6 py-3 rounded-xl font-semibold">Browse Restaurants</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div className="bg-white border-b px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-lg font-bold">Checkout</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* ORDER SUMMARY */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">Order from {vendorName}</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item._id} className="flex items-center gap-3">
                {item.image && <img src={item.image} alt="" className="w-12 h-12 rounded-xl object-cover" />}
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-gray-400 text-xs">{formatNGN(item.price)} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => useCartStore.getState().updateQty(item._id, item.qty - 1)} className="w-7 h-7 border rounded-full flex items-center justify-center hover:border-orange-400 transition">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-bold text-sm w-5 text-center">{item.qty}</span>
                  <button onClick={() => useCartStore.getState().updateQty(item._id, item.qty + 1)} className="w-7 h-7 border rounded-full flex items-center justify-center hover:border-orange-400 transition">
                    <Plus className="w-3 h-3" />
                  </button>
                  <button onClick={() => useCartStore.getState().removeItem(item._id)} className="text-gray-300 hover:text-red-500 ml-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <span className="font-bold text-sm w-20 text-right">{formatNGN(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* DELIVERY ADDRESS */}
        <AddressInput 
          onAddressChange={(updatedAddress) => setAddressData(updatedAddress)}
          initialState={addressData.state}
          initialLga={addressData.lga}
        />

        {/* PRICE SUMMARY */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">Payment Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span className="font-medium">{formatNGN(subtotal)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Delivery Fee</span><span className="font-medium">{formatNGN(deliveryFee)}</span></div>
            <div className="border-t pt-3 flex justify-between text-lg font-bold">
              <span>Total</span><span className="text-orange-500">{formatNGN(grandTotal)}</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
            <img src="https://website.pstk.xyz/img/paystack-logo.svg" alt="Paystack" className="h-4" />
            <span>Secured by Paystack — Pay with card, bank transfer or USSD</span>
          </div>
        </div>

        <button onClick={placeOrder} disabled={loading}
          className="w-full gradient-primary text-white py-4 rounded-2xl font-bold text-lg hover:opacity-90 transition disabled:opacity-60 shadow-lg shadow-orange-200">
          {loading ? 'Processing...' : `Pay ${formatNGN(grandTotal)} with Paystack`}
        </button>
      </div>
    </div>
  );
}
