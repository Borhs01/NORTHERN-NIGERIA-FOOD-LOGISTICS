import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Icon } from 'leaflet';
import { ArrowLeft, Phone, Clock, MapPin } from 'lucide-react';
import socket from '../../../services/socket';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import { getTomTomRoute, calculateDistance, estimateArrivalTime } from '../../../services/tomtomRouting';
import 'leaflet/dist/leaflet.css';

interface RiderInfo {
  name: string;
  phone: string;
  profileImage: string;
  vehiclePlate: string;
}

interface LocationUpdate {
  lat: number;
  lng: number;
  timestamp: Date;
}

interface RouteData {
  coordinates: Array<[number, number]>;
  distance: number; // km
  duration: number; // seconds
}

const ORDER_STATUSES = {
  pending: { label: 'Order Received', color: 'bg-blue-200' },
  confirmed: { label: 'Order Received', color: 'bg-blue-200' },
  preparing: { label: 'Preparing', color: 'bg-yellow-200' },
  ready_for_pickup: { label: 'Ready for Pickup', color: 'bg-orange-200' },
  on_the_way: { label: 'On the Way', color: 'bg-purple-200' },
  arrived: { label: 'Arrived', color: 'bg-green-200' },
  completed: { label: 'Completed', color: 'bg-green-500' },
};

// Custom bike icon
const bikeIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI4IiBjeT0iMjQiIHI9IjYiIGZpbGw9IiNFRjQ0NDQiLz48Y2lyY2xlIGN4PSIyNCIgY3k9IjI0IiByPSI2IiBmaWxsPSIjRUY0NDQ0Ii8+PHJlY3QgeD0iOCIgeT0iOCIgd2lkdGg9IjE2IiBoZWlnaHQ9IjQiIGZpbGw9IiNFRjQ0NDQiLz48L3N2Zz4=',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

export default function OrderTrackingPage() {
  const { id: orderId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [riderLocation, setRiderLocation] = useState<LocationUpdate | null>(null);
  const [customerLocation, setCustomerLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [vendorLocation, setVendorLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [riderInfo, setRiderInfo] = useState<RiderInfo | null>(null);
  const [status, setStatus] = useState<string>('pending');
  const [loading, setLoading] = useState(true);
  const [routeToRider, setRouteToRider] = useState<RouteData | null>(null);
  const [routeToCustomer, setRouteToCustomer] = useState<RouteData | null>(null);
  const [routeFetching, setRouteFetching] = useState(false);

  const fetchRoute = async (
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
    setRouteFn: (route: RouteData) => void
  ) => {
    try {
      const response = await getTomTomRoute({
        startLat,
        startLng,
        endLat,
        endLng,
        routeType: 'fastest',
      });
      setRouteFn({
        coordinates: response.coordinates,
        distance: response.distance,
        duration: response.duration,
      });
    } catch (error) {
      console.warn('Failed to fetch TomTom route, using fallback:', error);
      const distance = calculateDistance(startLat, startLng, endLat, endLng);
      const duration = estimateArrivalTime(distance) * 60;
      setRouteFn({
        coordinates: [[startLat, startLng], [endLat, endLng]],
        distance,
        duration,
      });
    }
  };

  useEffect(() => {
    if (!orderId) {
      console.error('No orderId provided');
      setTimeout(() => setLoading(false), 0);
      return;
    }

    const initializeOrderTracking = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Please log in to view order details');
          navigate('/auth');
          return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const { data } = await api.get(`/orders/${orderId}`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (data.paymentStatus === 'pending' && data.paymentRef) {
          try {
            await api.post('/payments/verify', { reference: data.paymentRef });
            toast.success('Payment verified!');
            const updatedData = await api.get(`/orders/${orderId}`);
            Object.assign(data, updatedData.data);
          } catch (err) {
            console.log('Payment verification failed:', err);
          }
        }

        let reference = new URLSearchParams(window.location.search).get('reference');
        if (!reference) {
          reference = sessionStorage.getItem('paymentReference');
        }

        if (reference && reference !== data.paymentRef) {
          try {
            await api.post('/payments/verify', { reference });
            toast.success('Payment verified!');
            sessionStorage.removeItem('paymentReference');
            sessionStorage.removeItem('orderId');
            const updatedData = await api.get(`/orders/${orderId}`);
            Object.assign(data, updatedData.data);
          } catch (err) {
            console.log('Payment verification:', err);
          }
        }

        const customerLat = data.deliveryAddressDetails?.lat || 9.8965;
        const customerLng = data.deliveryAddressDetails?.lng || 8.8583;
        const vendorLat = data.vendorId?.coordinates?.lat || 9.8965;
        const vendorLng = data.vendorId?.coordinates?.lng || 8.8583;

        setCustomerLocation({ lat: customerLat, lng: customerLng });
        setVendorLocation({ lat: vendorLat, lng: vendorLng });
        setRiderInfo({
          name: data.riderId?.name || 'Driver',
          phone: data.riderId?.phone || '',
          profileImage: data.riderId?.profileImage || '',
          vehiclePlate: data.riderId?.vehiclePlate || '',
        });
        setStatus(data.orderStatus);
        setLoading(false);
      } catch (error) {
        const err = error as { name?: string; response?: { status?: number } };
        if (err.name === 'AbortError') {
          toast.error('Request timed out. Please check your connection and try again.');
        } else if (err.response?.status === 404) {
          toast.error('Order not found');
          navigate('/orders');
        } else if (err.response?.status === 401) {
          toast.error('Authentication required');
          navigate('/auth');
        } else {
          toast.error('Failed to load order details. Please try again.');
        }
        setLoading(false);
      }
    };

    const loadingTimeout = setTimeout(() => {
      setLoading(false);
      toast.error('Loading took too long. Please refresh the page.');
    }, 15000);

    const handleLocationUpdate = (update: LocationUpdate) => {
      setRiderLocation(update);
      if (!routeFetching) {
        setRouteFetching(true);
        if (vendorLocation) {
          fetchRoute(vendorLocation.lat, vendorLocation.lng, update.lat, update.lng, setRouteToRider).finally(
            () => setRouteFetching(false)
          );
        }
        if (customerLocation) {
          fetchRoute(update.lat, update.lng, customerLocation.lat, customerLocation.lng, setRouteToCustomer).finally(
            () => setRouteFetching(false)
          );
        }
      }
    };

    const handleStatusChanged = async ({ status: newStatus }: { status: string }) => {
      setStatus(newStatus);
      try {
        const { data } = await api.get(`/orders/${orderId}`);
        setRiderInfo({
          name: data.riderId?.name || 'Driver',
          phone: data.riderId?.phone || '',
          profileImage: data.riderId?.profileImage || '',
          vehiclePlate: data.riderId?.vehiclePlate || '',
        });
      } catch (error) {
        console.log('Failed to refresh order data after status change:', error);
      }
    };

    const handleCustomerLocation = (data: {
      customerLat: number;
      customerLng: number;
      vendorLat: number;
      vendorLng: number;
    }) => {
      setCustomerLocation({ lat: data.customerLat, lng: data.customerLng });
      setVendorLocation({ lat: data.vendorLat, lng: data.vendorLng });
    };

    socket.emit('customer:join-tracking', orderId);
    socket.on('rider:location-update', handleLocationUpdate);
    socket.on('rider:status-changed', handleStatusChanged);
    socket.on('rider:customer-location', handleCustomerLocation);

    initializeOrderTracking();

    return () => {
      clearTimeout(loadingTimeout);
      socket.off('rider:location-update', handleLocationUpdate);
      socket.off('rider:status-changed', handleStatusChanged);
      socket.off('rider:customer-location', handleCustomerLocation);
    };
  }, [orderId, navigate, routeFetching, customerLocation, vendorLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!customerLocation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-red-600">Unable to load delivery location</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = ORDER_STATUSES[status as keyof typeof ORDER_STATUSES] || ORDER_STATUSES.pending;

  const riderToCustomerPolyline = routeToCustomer?.coordinates || (
    riderLocation && customerLocation ? [[riderLocation.lat, riderLocation.lng], [customerLocation.lat, customerLocation.lng]] : []
  );

  const vendorToRiderPolyline = routeToRider?.coordinates || (
    riderLocation && vendorLocation ? [[vendorLocation.lat, vendorLocation.lng], [riderLocation.lat, riderLocation.lng]] : []
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative h-96 bg-white shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <MapContainer
          center={
            riderLocation
              ? [riderLocation.lat, riderLocation.lng]
              : customerLocation.lat && customerLocation.lng && vendorLocation?.lat && vendorLocation?.lng
              ? [(customerLocation.lat + vendorLocation.lat) / 2, (customerLocation.lng + vendorLocation.lng) / 2]
              : customerLocation.lat && customerLocation.lng
              ? [customerLocation.lat, customerLocation.lng]
              : [9.8965, 8.8583]
          }
          zoom={riderLocation ? 16 : customerLocation.lat && vendorLocation?.lat ? 13 : 12}
          className="w-full h-full"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />

          {riderLocation && (status === 'on_the_way' || status === 'arrived' || status === 'completed') && (
            <Marker position={[riderLocation.lat, riderLocation.lng]} icon={bikeIcon}>
              <Popup>Rider Location</Popup>
            </Marker>
          )}

          {vendorLocation && (
            <Marker position={[vendorLocation.lat, vendorLocation.lng]}>
              <Popup>Pickup Location</Popup>
            </Marker>
          )}

          {customerLocation && (
            <Marker position={[customerLocation.lat, customerLocation.lng]}>
              <Popup>Delivery Location</Popup>
            </Marker>
          )}

          {riderLocation && (status === 'on_the_way' || status === 'arrived' || status === 'completed') && (
            <>
              {vendorToRiderPolyline.length > 0 && (
                <Polyline positions={vendorToRiderPolyline as [number, number][]} color="blue" weight={3} opacity={0.7} />
              )}
              {riderToCustomerPolyline.length > 0 && (
                <Polyline positions={riderToCustomerPolyline as [number, number][]} color="green" weight={3} opacity={0.7} />
              )}
            </>
          )}
        </MapContainer>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className={`rounded-2xl p-4 text-white text-center font-bold ${statusInfo.color}`}>{statusInfo.label}</div>
        {riderInfo &&
          (status === 'ready_for_pickup' || status === 'on_the_way' || status === 'arrived' || status === 'completed') && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                {riderInfo.profileImage && (
                  <img src={riderInfo.profileImage} alt={riderInfo.name} className="w-16 h-16 rounded-full object-cover" />
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900">{riderInfo.name}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {riderInfo.vehiclePlate}
                  </p>
                </div>
                <a href={`tel:${riderInfo.phone}`} className="bg-orange-500 hover:bg-orange-600 text-white rounded-full p-3 transition">
                  <Phone className="w-5 h-5" />
                </a>
              </div>
            </div>
          )}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Delivery Details</h3>
          {riderLocation && (status === 'on_the_way' || status === 'arrived' || status === 'completed') && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              {routeToCustomer ? (
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Delivery Distance:</span> {routeToCustomer.distance.toFixed(1)} km
                  <span className="ml-4 font-semibold">ETA:</span> {Math.ceil(routeToCustomer.duration / 60)} minutes
                </p>
              ) : (
                <p className="text-sm text-gray-500">Loading route details...</p>
              )}
            </div>
          )}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-orange-500 mt-1 shrink-0" />
              <div>
                <p className="text-sm text-gray-500">From Vendor</p>
                <p className="font-medium text-gray-900">
                  {status === 'preparing'
                    ? 'Preparing your order'
                    : status === 'ready_for_pickup'
                    ? 'Order ready for pickup'
                    : 'Order picked up'}
                </p>
              </div>
            </div>
            {status === 'ready_for_pickup' && riderInfo && (
              <div className="border-l-2 border-orange-200 ml-2.5 pl-3 py-4">
                <Clock className="w-5 h-5 text-orange-500 mb-2" />
                <p className="text-sm text-gray-500">Rider assigned - waiting for pickup</p>
              </div>
            )}
            {(status === 'on_the_way' || status === 'arrived' || status === 'completed') && (
              <div className="border-l-2 border-orange-200 ml-2.5 pl-3 py-4">
                <Clock className="w-5 h-5 text-orange-500 mb-2" />
                <p className="text-sm text-gray-500">
                  {status === 'on_the_way'
                    ? 'On the way to you'
                    : status === 'arrived'
                    ? 'Rider has arrived'
                    : 'Delivery completed'}
                </p>
              </div>
            )}
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-orange-500 mt-1 shrink-0" />
              <div>
                <p className="text-sm text-gray-500">To Your Location</p>
                <p className="font-medium text-gray-900">
                  {status === 'completed'
                    ? 'Delivered successfully'
                    : status === 'arrived'
                    ? 'Rider is here'
                    : 'Arriving soon'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
