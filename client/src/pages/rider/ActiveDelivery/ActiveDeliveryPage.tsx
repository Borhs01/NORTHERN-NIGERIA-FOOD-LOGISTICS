import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import { Icon } from 'leaflet';
import { ArrowLeft, Navigation, CheckCircle, Phone, MapPin } from 'lucide-react';
import socket from '../../../services/socket';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import { formatNGN } from '../../../utils/constants';
import { getTomTomRoute, calculateDistance, estimateArrivalTime } from '../../../services/tomtomRouting';
import 'leaflet/dist/leaflet.css';

interface FoodItem {
  _id: string;
  name: string;
  unitPrice: number;
  qty: number;
}

interface ActiveOrder {
  _id: string;
  deliveryAddress: string;
  deliveryAddressDetails: { lat: number; lng: number };
  vendorId: { name: string; address: string; coordinates: { lat: number; lng: number } };
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  items: FoodItem[];
  status: string;
}

interface RouteData {
  coordinates: [number, number][];
  distance: number;
  duration: number;
}

const ORDER_STEPS = [
  { key: 'arrived_vendor', label: 'Arrived at Vendor', status: 'ready_for_pickup' },
  { key: 'picked_up', label: 'Picked Up Food', status: 'on_the_way' },
  { key: 'arrived_customer', label: 'Arrived at Customer', status: 'arrived' },
  { key: 'completed', label: 'Delivery Complete', status: 'completed' },
];

// Custom rider location icon
const riderIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxMiIgZmlsbD0iIzM2N0VGRiIvPjwvc3ZnPg==',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

export default function ActiveDeliveryPage() {
  const navigate = useNavigate();
  const [order, setOrder] = useState<ActiveOrder | null>(null);
  const [riderLocation, setRiderLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [routeToVendor, setRouteToVendor] = useState<RouteData | null>(null);
  const [routeToCustomer, setRouteToCustomer] = useState<RouteData | null>(null);

  const currentRoute = currentStep === 0 ? routeToVendor : routeToCustomer;
  const currentRouteLabel = currentStep === 0 ? 'Vendor' : 'Customer';
  const watchIdRef = useRef<number | null>(null);
  const orderRef = useRef<ActiveOrder | null>(null);

  useEffect(() => {
    const fetchActiveOrder = async () => {
      try {
        // Get rider's active orders
        const { data } = await api.get('/riders/active-orders');
        if (data.orders && data.orders.length > 0) {
          const activeOrder = data.orders[0];
          setOrder(activeOrder);
          orderRef.current = activeOrder;

          // Join delivery room
          socket.emit('rider:join-delivery', activeOrder._id);

          // Determine current step
          const stepIndex = ORDER_STEPS.findIndex(
            (s) => s.status === activeOrder.status
          );
          const normalizedStep = Math.max(stepIndex, 0);
          setCurrentStep(normalizedStep);

          // Start location tracking with the loaded order
          startLocationTracking(activeOrder._id, activeOrder);
          
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch active order:', error);
        toast.error('No active delivery found');
        navigate('/rider/dashboard');
      }
    };

    fetchActiveOrder();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const fetchRoute = async (
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
    setRouteFn: (route: RouteData | null) => void
  ) => {
    try {
      console.log('📍 Fetching route from', { startLat, startLng }, 'to', {
        endLat,
        endLng,
      });

      const routeResponse = await getTomTomRoute({
        startLat,
        startLng,
        endLat,
        endLng,
        routeType: 'fastest',
      });

      console.log('📍 Route response received:', {
        coordinatesCount: routeResponse.coordinates.length,
        distance: routeResponse.distance,
        duration: routeResponse.duration,
      });

      setRouteFn({
        coordinates: routeResponse.coordinates,
        distance: routeResponse.distance,
        duration: routeResponse.duration,
      });
    } catch (error) {
      console.error('❌ Error fetching route:', error);
      // Fallback: use straight line distance
      const fallbackDistance = calculateDistance(
        startLat,
        startLng,
        endLat,
        endLng
      );
      const fallbackDuration = estimateArrivalTime(fallbackDistance) * 60; // Convert to seconds
      setRouteFn({
        coordinates: [
          [startLat, startLng],
          [endLat, endLng],
        ],
        distance: fallbackDistance,
        duration: fallbackDuration,
      });
    }
  };

  const startLocationTracking = (orderId: string, activeOrder: ActiveOrder) => {
    console.log('Starting location tracking for order:', orderId);
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }

    // Request location permission first
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Initial location obtained:', position.coords);
        const { latitude, longitude } = position.coords;
        setRiderLocation({ lat: latitude, lng: longitude });
      },
      (error) => {
        console.error('Initial geolocation error:', error);
        toast.error('Please enable location permissions');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('Location update:', latitude, longitude);
        setRiderLocation({ lat: latitude, lng: longitude });

        // Send location to server
        socket.emit('rider:update-location', {
          orderId,
          lat: latitude,
          lng: longitude,
          status: orderRef.current?.status || activeOrder.status,
        });
        console.log('Sent location update to server');
      },
      (error) => {
        console.error('Geolocation watch error:', error);
        toast.error('Failed to track location. Please check permissions.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );
  };

  const handleStepClick = async (stepIndex: number) => {
    if (stepIndex < currentStep) return; // Can't go back
    if (stepIndex > currentStep + 1) return; // Can't skip

    try {
      const step = ORDER_STEPS[stepIndex];
      setLoading(true);

      // Update order status
      await api.patch(`/orders/${order?._id}/status`, { status: step.status });
      setOrder((prev) => (prev ? { ...prev, status: step.status } : prev));
      if (orderRef.current) {
        orderRef.current = { ...orderRef.current, status: step.status };
      }

      // Emit socket event
      socket.emit('rider:update-status', {
        orderId: order?._id,
        status: step.status,
      });

      setCurrentStep(stepIndex);
      toast.success(step.label);

      if (stepIndex === ORDER_STEPS.length - 1) {
        // Delivery completed
        toast.success('Delivery completed! Redirecting...');
        setTimeout(() => navigate('/rider/dashboard'), 2000);
      }
    } catch {
      toast.error('Failed to update delivery status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!order || !riderLocation) {
      return;
    }

    const startLat = riderLocation.lat;
    const startLng = riderLocation.lng;
    const targetLat =
      currentStep === 0
        ? order.vendorId.coordinates.lat
        : order.deliveryAddressDetails?.lat || 9.8965;
    const targetLng =
      currentStep === 0
        ? order.vendorId.coordinates.lng
        : order.deliveryAddressDetails?.lng || 8.8583;
    const setRouteFn = currentStep === 0 ? setRouteToVendor : setRouteToCustomer;

    if (typeof targetLat === 'number' && typeof targetLng === 'number') {
      fetchRoute(startLat, startLng, targetLat, targetLng, setRouteFn);
    }
  }, [order, riderLocation, currentStep]);

  const openGoogleMaps = () => {
    if (order) {
      const lat = order.deliveryAddressDetails?.lat || 9.8965;
      const lng = order.deliveryAddressDetails?.lng || 8.8583;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(url, '_blank');
    }
  };

  if (loading || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading active delivery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/rider/dashboard')}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">Active Delivery</h1>
      </div>

      {/* Map */}
      <div className="h-80 bg-white shadow-sm relative">
        <MapContainer
          center={
            riderLocation 
              ? [riderLocation.lat, riderLocation.lng] 
              : [
                  order.vendorId?.coordinates?.lat || 9.8965, 
                  order.vendorId?.coordinates?.lng || 8.8583
                ]
          }
          zoom={15}
          className="w-full h-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Rider current location */}
          {riderLocation && (
            <Marker position={[riderLocation.lat, riderLocation.lng]} icon={riderIcon}>
              <Popup>Your Location</Popup>
            </Marker>
          )}

          {/* Vendor location */}
          <Marker position={[
            order.vendorId?.coordinates?.lat || 9.8965, 
            order.vendorId?.coordinates?.lng || 8.8583
          ]}>
            <Popup>{order.vendorId?.name || 'Vendor'}</Popup>
          </Marker>

          {/* Customer location */}
          <Marker position={[
            order.deliveryAddressDetails?.lat || 9.8965, 
            order.deliveryAddressDetails?.lng || 8.8583
          ]}>
            <Popup>Delivery Location</Popup>
          </Marker>

          {/* Route polyline */}
          {currentStep === 0 && routeToVendor && (
            <Polyline
              positions={routeToVendor.coordinates}
              color="blue"
              weight={4}
              opacity={0.8}
            />
          )}
          {currentStep >= 1 && routeToCustomer && (
            <Polyline
              positions={routeToCustomer.coordinates}
              color="green"
              weight={4}
              opacity={0.8}
            />
          )}

          {/* Delivery radius (1km) */}
          <Circle
            center={[
              order.deliveryAddressDetails?.lat || 9.8965, 
              order.deliveryAddressDetails?.lng || 8.8583
            ]}
            radius={1000}
            color="orange"
            fillOpacity={0.1}
          />
        </MapContainer>

        <button
          onClick={openGoogleMaps}
          className="absolute bottom-4 right-4 bg-white rounded-lg shadow-md p-3 hover:shadow-lg transition"
        >
          <Navigation className="w-5 h-5 text-orange-500" />
        </button>
      </div>

      {/* Delivery Info */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Distance and ETA */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Route to {currentRouteLabel}</p>
            <p className="text-2xl font-bold text-orange-500">
              {currentRoute ? currentRoute.distance.toFixed(1) : '--'} km
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Estimated Arrival</p>
            <p className="text-2xl font-bold text-blue-500">
              {currentRoute ? `${Math.ceil(currentRoute.duration / 60)}` : '--'} min
            </p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-3">Customer</h3>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">{order.customerName}</p>
            <a
              href={`tel:${order.customerPhone}`}
              className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-600 font-medium"
            >
              <Phone className="w-4 h-4" />
              {order.customerPhone}
            </a>
            <div className="flex items-start gap-2 mt-3">
              <MapPin className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
              <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
            </div>
          </div>
        </div>

        {/* Delivery Steps */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Delivery Steps</h3>
          <div className="space-y-2">
            {ORDER_STEPS.map((step, index) => (
              <button
                key={step.key}
                onClick={() => handleStepClick(index)}
                disabled={index > currentStep + 1 || loading}
                className={`w-full p-3 rounded-lg font-medium transition flex items-center gap-2 ${
                  index <= currentStep
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {index < currentStep && <CheckCircle className="w-5 h-5" />}
                {step.label}
              </button>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-3">Order Summary</h3>
          <div className="space-y-2 mb-4 pb-4 border-b">
            {order.items.slice(0, 3).map((item: FoodItem, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.name} (×{item.qty})</span>
                <span className="font-medium">{formatNGN(item.unitPrice * item.qty)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-bold">
            <span>Total Amount</span>
            <span className="text-orange-500">{formatNGN(order.totalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
