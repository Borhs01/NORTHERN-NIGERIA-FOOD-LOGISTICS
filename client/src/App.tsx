import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import LandingPage from './pages/Landing/LandingPage';
import AuthPage from './pages/Auth/AuthPage';
import ConsumerHome from './pages/consumer/Home/ConsumerHome';
import VendorMenuPage from './pages/consumer/VendorPage/VendorMenuPage';
import CheckoutPage from './pages/consumer/Cart/CheckoutPage';
import OrderTrackingPage from './pages/consumer/Orders/OrderTrackingPage';
import MyOrdersPage from './pages/consumer/Orders/MyOrdersPage';
import VendorDashboard from './pages/vendor/Dashboard/VendorDashboard';
import VendorMenuManager from './pages/vendor/MenuManager/VendorMenuManager';
import VendorOrdersPage from './pages/vendor/Orders/VendorOrdersPage';
import RiderDashboard from './pages/rider/Dashboard/RiderDashboard';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminOverview from './pages/admin/Overview/AdminOverview';
import AdminVendors from './pages/admin/Vendors/VendorList';
import AdminVendorDetail from './pages/admin/Vendors/VendorDetail';
import PendingApprovals from './pages/admin/Vendors/PendingApprovals';
import AdminRiders from './pages/admin/Riders/RiderList';
import AdminRiderDetail from './pages/admin/Riders/RiderDetail';
import AdminConsumers from './pages/admin/Consumers/ConsumerList';
import AdminOrders from './pages/admin/Orders/AllOrders';
import AdminOrderDetail from './pages/admin/Orders/OrderDetail';
import AdminPayments from './pages/admin/Payments/Transactions';
import AdminReviews from './pages/admin/Reviews/ReviewModeration';
import AdminPromotions from './pages/admin/Promotions/PromotionManager';
import AdminSettings from './pages/admin/Settings/PlatformSettings';

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
    </BrowserRouter>
  );
}
