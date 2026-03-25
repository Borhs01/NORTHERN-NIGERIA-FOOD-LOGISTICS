export const STATES = {
  plateau: {
    label: 'Plateau State',
    lgas: ['Jos North', 'Jos South', 'Bukuru', 'Barkin Ladi', 'Pankshin', 'Shendam', 'Mangu'],
  },
  bauchi: {
    label: 'Bauchi State',
    lgas: ['Bauchi Metro', 'Azare', 'Misau', 'Katagum', 'Dass', 'Tafawa Balewa'],
  },
  kaduna: {
    label: 'Kaduna State',
    lgas: ['Kaduna North', 'Kaduna South', 'Zaria', 'Kafanchan', 'Soba', 'Birnin Gwari', 'Sabon Gari'],
  },
};

export const FOOD_CATEGORIES = [
  'All', 'Rice Dishes', 'Soups & Stews', 'Grills & Suya', 'Swallows',
  'Fast Food', 'Snacks', 'Drinks & Juice', 'Breakfast', 'Kilishi & Dried Meat', 'Pastries',
];

export const ORDER_STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'picked_up', label: 'Picked Up' },
  { key: 'delivered', label: 'Delivered' },
];

export const formatNGN = (amount: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);

export const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-purple-100 text-purple-800',
  ready: 'bg-indigo-100 text-indigo-800',
  picked_up: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};
