import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Suspense, lazy } from 'react';
import { useAuthStore } from './store/authStore';

// Lazy load components for code splitting
const LandingPage = lazy(() => import('./pages/Landing/LandingPage'));
const AuthPage = lazy(() => import('./pages/Auth/AuthPage'));

// Consumer pages
const ConsumerHome = lazy(() => import('./pages/consumer/Home/ConsumerHome'));
const VendorMenuPage = lazy(() => import('./pages/consumer/VendorPage/VendorMenuPage'));
const CheckoutPage = lazy(() => import('./pages/consumer/Cart/CheckoutPage'));
const OrderTrackingPage = lazy(() => import('./pages/consumer/Orders/OrderTrackingPage'));
const MyOrdersPage = lazy(() => import('./pages/consumer/Orders/MyOrdersPage'));

// Vendor pages
const VendorDashboard = lazy(() => import('./pages/vendor/Dashboard/VendorDashboard'));
const VendorMenuManager = lazy(() => import('./pages/vendor/MenuManager/VendorMenuManager'));
const VendorOrdersPage = lazy(() => import('./pages/vendor/Orders/VendorOrdersPage'));

// Rider pages
const RiderDashboard = lazy(() => import('./pages/rider/Dashboard/RiderDashboard'));

// Admin pages
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminOverview = lazy(() => import('./pages/admin/Overview/AdminOverview'));
const AdminVendors = lazy(() => import('./pages/admin/Vendors/VendorList'));
const AdminVendorDetail = lazy(() => import('./pages/admin/Vendors/VendorDetail'));
const PendingApprovals = lazy(() => import('./pages/admin/Vendors/PendingApprovals'));
const AdminRiders = lazy(() => import('./pages/admin/Riders/RiderList'));
const AdminRiderDetail = lazy(() => import('./pages/admin/Riders/RiderDetail'));
const AdminConsumers = lazy(() => import('./pages/admin/Consumers/ConsumerList'));
const AdminOrders = lazy(() => import('./pages/admin/Orders/AllOrders'));
const AdminOrderDetail = lazy(() => import('./pages/admin/Orders/OrderDetail'));
const AdminPayments = lazy(() => import('./pages/admin/Payments/Transactions'));
const AdminReviews = lazy(() => import('./pages/admin/Reviews/ReviewModeration'));
const AdminPromotions = lazy(() => import('./pages/admin/Promotions/PromotionManager'));
const AdminSettings = lazy(() => import('./pages/admin/Settings/PlatformSettings'));

const ProtectedRoute = ({ children, role }: { children: React.ReactNode; role?: string | string[] }) => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/auth" replace />;
  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />

          <Route path="/home" element={<ProtectedRoute role="consumer"><ConsumerHome /></ProtectedRoute>} />
          <Route path="/vendor/:id" element={<ProtectedRoute role="consumer"><VendorMenuPage /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute role="consumer"><CheckoutPage /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute role="consumer"><MyOrdersPage /></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute role="consumer"><OrderTrackingPage /></ProtectedRoute>} />

          <Route path="/vendor/dashboard" element={<ProtectedRoute role="vendor"><VendorDashboard /></ProtectedRoute>} />
          <Route path="/vendor/menu" element={<ProtectedRoute role="vendor"><VendorMenuManager /></ProtectedRoute>} />
          <Route path="/vendor/orders" element={<ProtectedRoute role="vendor"><VendorOrdersPage /></ProtectedRoute>} />

          <Route path="/rider/dashboard" element={<ProtectedRoute role="rider"><RiderDashboard /></ProtectedRoute>} />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminOverview />} />
            <Route path="vendors" element={<AdminVendors />} />
            <Route path="vendors/pending" element={<PendingApprovals />} />
            <Route path="vendors/:id" element={<AdminVendorDetail />} />
            <Route path="riders" element={<AdminRiders />} />
            <Route path="riders/:id" element={<AdminRiderDetail />} />
            <Route path="consumers" element={<AdminConsumers />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:id" element={<AdminOrderDetail />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="promotions" element={<AdminPromotions />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
