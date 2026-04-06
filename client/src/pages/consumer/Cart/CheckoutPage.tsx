import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Trash2, ShoppingCart, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { pricingApi } from '../../../services/api';
import { useCartStore } from '../../../store/cartStore';
import { useAuthStore } from '../../../store/authStore';
import { formatNGN, STATES } from '../../../utils/constants';
import { useGeolocation } from '../../../hooks/useGeolocation';

interface DeliveryFeeData {
  fee: number;
  estimatedMinutes: number;
  distanceKm: number;
  breakdown: {
    baseFare: number;
    distanceFee: number;
    timeFee: number;
    surgeMultiplier: number;
    peakMultiplier: number;
  };
  isPeakHour: boolean;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, vendorId, vendorName, total, deliveryFee: cartDeliveryFee, clearCart } = useCartStore();
  const { location, error: locationError, refresh: refreshLocation } = useGeolocation();
  const [loading, setLoading] = useState(false);
  const [feeLoading, setFeeLoading] = useState(false);
  const [feeData, setFeeData] = useState<DeliveryFeeData | null>(null);
  const subtotal = total();
  const deliveryFee = feeData?.fee || cartDeliveryFee;
  const grandTotal = subtotal + deliveryFee;

  useEffect(() => {
    const fetchDeliveryFee = async () => {
      if (!vendorId || !location?.lat || !location?.lng) return;
      setFeeLoading(true);
      try {
        const data = await pricingApi.calculateDeliveryFee(vendorId, location.lat, location.lng);
        setFeeData(data);
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } };
        toast.error(error.response?.data?.message || 'Could not calculate delivery fee');
        setFeeData(null);
      } finally {
        setFeeLoading(false);
      }
    };
    fetchDeliveryFee();
  }, [vendorId, location?.lat, location?.lng]);


  const placeOrder = async () => {
    if (!location?.address?.trim()) return toast.error('Please set your location on the dashboard before checking out');
    if (!items.length) return toast.error('Your cart is empty');
    setLoading(true);
    try {
      const orderState = (location?.state || user?.state || 'plateau') as keyof typeof STATES;
      const orderPayload = {
        vendorId,
        state: location.state || user?.state || 'plateau',
        deliveryAddress: location.address,
        deliveryLga: location.lga || user?.lga || STATES[orderState].lgas[0],
        deliveryAddressDetails: {
          lat: location.lat,
          lng: location.lng,
        },
        items: items.map((i) => ({ foodItemId: i._id, name: i.name, qty: i.qty, unitPrice: i.price, image: i.image })),
        deliveryFee: deliveryFee, // Include the calculated delivery fee
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

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">Delivery Location</h2>
          <div className="rounded-2xl border border-gray-200 p-4 bg-gray-50">
            <p className="text-sm text-gray-600 mb-2">Your checkout location is taken from the app location selector.</p>
            <p className="font-semibold text-gray-900">{location?.address || 'No location set yet. Please select your location on the dashboard.'}</p>
            {location?.state && location?.lga && (
              <p className="text-sm text-gray-500 mt-2">{location.lga}, {location.state}</p>
            )}
            {locationError && (
              <p className="text-sm text-red-600 mt-2">{locationError}</p>
            )}
            {!location && (
              <button
                onClick={refreshLocation}
                className="mt-4 inline-flex items-center justify-center rounded-2xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition"
                type="button"
              >
                Refresh Location
              </button>
            )}
          </div>
        </div>

        {/* DELIVERY FEE BREAKDOWN */}
        {feeData && (
          <div className={`rounded-2xl p-6 shadow-sm ${feeData.breakdown.peakMultiplier > 1 || feeData.breakdown.surgeMultiplier > 1 ? 'bg-orange-50 border border-orange-200' : 'bg-white'}`}>
            <div className="flex items-start gap-2 mb-4">
              <h2 className="font-bold text-gray-900 flex-1">Delivery Fee Breakdown</h2>
              {(feeData.breakdown.peakMultiplier > 1 || feeData.breakdown.surgeMultiplier > 1) && (
                <div className="flex items-center gap-1 text-orange-600 text-sm font-semibold">
                  <AlertCircle className="w-4 h-4" />
                  Surge Pricing
                </div>
              )}
            </div>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Base fare</span>
                <span>{formatNGN(feeData.breakdown.baseFare)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Distance ({feeData.distanceKm} km)</span>
                <span>{formatNGN(feeData.breakdown.distanceFee)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Time ({feeData.estimatedMinutes} min)</span>
                <span>{formatNGN(feeData.breakdown.timeFee)}</span>
              </div>
              {feeData.breakdown.peakMultiplier > 1 && (
                <div className="flex justify-between text-orange-600 font-semibold">
                  <span>Peak hours (×{feeData.breakdown.peakMultiplier})</span>
                  <span>+{Math.round((feeData.breakdown.peakMultiplier - 1) * 100)}%</span>
                </div>
              )}
              {feeData.breakdown.surgeMultiplier > 1 && (
                <div className="flex justify-between text-orange-600 font-semibold">
                  <span>High demand (×{feeData.breakdown.surgeMultiplier})</span>
                  <span>+{Math.round((feeData.breakdown.surgeMultiplier - 1) * 100)}%</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PRICE SUMMARY */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4">Payment Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span className="font-medium">{formatNGN(subtotal)}</span></div>
            <div className="flex justify-between text-gray-600">
              <span className="flex items-center gap-2">
                Delivery Fee 
                {feeLoading && <span className="text-xs text-gray-400">calculating...</span>}
              </span>
              <span className="font-medium">{formatNGN(deliveryFee)}</span>
            </div>
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
