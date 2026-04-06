import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface UserProfile {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  state?: string;
  lga?: string;
  address?: string;
  profile?: Record<string, unknown>;
}

interface ProfileDropdownProps {
  user: UserProfile | null;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  supportEmail?: string;
  supportPhone?: string;
  compact?: boolean;
}

const roleLabel = (role?: string) => {
  switch (role) {
    case 'consumer':
      return 'Customer';
    case 'vendor':
      return 'Vendor';
    case 'rider':
      return 'Rider';
    case 'admin':
      return 'Admin';
    default:
      return 'User';
  }
};

const dashboardRoute = (role?: string) => {
  switch (role) {
    case 'consumer':
      return '/home';
    case 'vendor':
      return '/vendor/dashboard';
    case 'rider':
      return '/rider/dashboard';
    case 'admin':
      return '/admin';
    default:
      return '/';
  }
};

export default function ProfileDropdown({ user, onNavigate, onLogout, supportEmail = 'support@northeats.com', supportPhone = '+234 800 000 0000', compact = false }: ProfileDropdownProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const displayName = user.name || 'Profile';

  const renderDropdown = () => (
    <div className="absolute right-0 mt-3 w-72 bg-white rounded-3xl border border-gray-200 shadow-xl z-40 overflow-hidden">
      <div className="bg-linear-to-r from-orange-500 to-red-500 p-4 text-white">
        <p className="text-sm font-semibold">{user.name}</p>
        <p className="text-xs text-orange-100 mt-1">{roleLabel(user.role)}</p>
      </div>
      <div className="p-4 space-y-3 text-sm text-gray-700">
        {user.email && (
          <div>
            <p className="font-semibold">Email</p>
            <p className="text-gray-500 truncate">{user.email}</p>
          </div>
        )}
        {user.phone && (
          <div>
            <p className="font-semibold">Phone</p>
            <p className="text-gray-500 truncate">{user.phone}</p>
          </div>
        )}
        {(user.state || user.lga) && (
          <div>
            <p className="font-semibold">Location</p>
            <p className="text-gray-500 truncate">{[user.lga, user.state].filter(Boolean).join(', ')}</p>
          </div>
        )}
        {user.address && (
          <div>
            <p className="font-semibold">Address</p>
            <p className="text-gray-500 truncate">{user.address}</p>
          </div>
        )}
        <div className="border-t border-gray-100 pt-3">
          <p className="font-semibold">Support</p>
          <p className="text-gray-500 truncate">{supportEmail}</p>
          <p className="text-gray-500 truncate">{supportPhone}</p>
        </div>
      </div>
      <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-2">
        <button
          onClick={() => { onNavigate(dashboardRoute(user.role)); setOpen(false); }}
          className="w-full text-left rounded-2xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-white"
        >
          Dashboard
        </button>
        <button
          onClick={() => { window.location.href = `mailto:${supportEmail}`; setOpen(false); }}
          className="w-full text-left rounded-2xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-white"
        >
          Contact Support
        </button>
        <button
          onClick={() => { onLogout(); setOpen(false); }}
          className="w-full text-left rounded-2xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-white"
        >
          Logout
        </button>
      </div>
    </div>
  );

  if (compact) {
    return (
      <div className="relative" ref={panelRef}>
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20 transition"
        >
          <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-semibold">
            {user.name?.[0] || 'U'}
          </div>
          <span>{displayName.split(' ')[0]}</span>
          <ChevronDown className="w-4 h-4 text-white" />
        </button>
        {open && renderDropdown()}
      </div>
    );
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:shadow-sm transition"
      >
        <div className="w-9 h-9 rounded-full bg-orange-500 text-white flex items-center justify-center font-semibold">
          {user.name?.[0] || 'U'}
        </div>
        <span>{displayName}</span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-72 bg-white rounded-3xl border border-gray-200 shadow-xl z-40 overflow-hidden">
          <div className="bg-linear-to-r from-orange-500 to-red-500 p-4 text-white">
            <p className="text-sm font-semibold">{user.name}</p>
            <p className="text-xs text-orange-100 mt-1">{roleLabel(user.role)}</p>
          </div>
          <div className="p-4 space-y-3 text-sm text-gray-700">
            {user.email && (
              <div>
                <p className="font-semibold">Email</p>
                <p className="text-gray-500 truncate">{user.email}</p>
              </div>
            )}
            {user.phone && (
              <div>
                <p className="font-semibold">Phone</p>
                <p className="text-gray-500 truncate">{user.phone}</p>
              </div>
            )}
            {(user.state || user.lga) && (
              <div>
                <p className="font-semibold">Location</p>
                <p className="text-gray-500 truncate">{[user.lga, user.state].filter(Boolean).join(', ')}</p>
              </div>
            )}
            {user.address && (
              <div>
                <p className="font-semibold">Address</p>
                <p className="text-gray-500 truncate">{user.address}</p>
              </div>
            )}
            <div className="border-t border-gray-100 pt-3">
              <p className="font-semibold">Support</p>
              <p className="text-gray-500 truncate">{supportEmail}</p>
              <p className="text-gray-500 truncate">{supportPhone}</p>
            </div>
          </div>
          <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-2">
            <button
              onClick={() => { onNavigate(dashboardRoute(user.role)); setOpen(false); }}
              className="w-full text-left rounded-2xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-white"
            >
              Dashboard
            </button>
            <button
              onClick={() => { window.location.href = `mailto:${supportEmail}`; setOpen(false); }}
              className="w-full text-left rounded-2xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-white"
            >
              Contact Support
            </button>
            <button
              onClick={() => { onLogout(); setOpen(false); }}
              className="w-full text-left rounded-2xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-white"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
