import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Store, Bike, Users, ShoppingBag, CreditCard,
  Star, Tag, Settings, ChefHat, Bell, LogOut, Menu, X
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const NAV_ITEMS = [
  { path: '/admin', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Overview', end: true },
  { path: '/admin/vendors', icon: <Store className="w-5 h-5" />, label: 'Vendors' },
  { path: '/admin/riders', icon: <Bike className="w-5 h-5" />, label: 'Riders' },
  { path: '/admin/consumers', icon: <Users className="w-5 h-5" />, label: 'Consumers' },
  { path: '/admin/orders', icon: <ShoppingBag className="w-5 h-5" />, label: 'Orders' },
  { path: '/admin/payments', icon: <CreditCard className="w-5 h-5" />, label: 'Payments' },
  { path: '/admin/reviews', icon: <Star className="w-5 h-5" />, label: 'Reviews' },
  { path: '/admin/promotions', icon: <Tag className="w-5 h-5" />, label: 'Promotions' },
  { path: '/admin/settings', icon: <Settings className="w-5 h-5" />, label: 'Settings' },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/admin/login'); };

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full ${mobile ? '' : 'w-64'}`} style={{ background: '#1A1A2E' }}>
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">NorthEats</p>
            <p className="text-gray-400 text-xs">Admin Panel</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider px-3 mb-3">Main Menu</p>
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.path} to={item.path} end={item.end}
            onClick={() => mobile && setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-medium transition ${isActive ? 'gradient-primary text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/8'}`
            }>
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 gradient-primary rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-gray-400 text-xs">Administrator</p>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition text-sm">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ fontFamily: 'Inter, sans-serif' }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />

      {/* DESKTOP SIDEBAR */}
      <div className="hidden lg:flex flex-col flex-shrink-0 sticky top-0 h-screen">
        <Sidebar />
      </div>

      {/* MOBILE SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 w-64">
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
        {/* TOPBAR */}
        <header className="bg-white border-b border-gray-100 px-4 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-800">
            <Menu className="w-6 h-6" />
          </button>
          <div className="lg:hidden" />
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-gray-500 hover:text-orange-500 transition">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 gradient-primary rounded-full" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.[0]}
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-700">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
