import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  _id: string;
  name: string;
  price: number;
  image: string;
  qty: number;
  vendorId: string;
}

interface CartState {
  items: CartItem[];
  vendorId: string | null;
  vendorName: string | null;
  addItem: (item: CartItem, vendorId: string, vendorName: string) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  total: () => number;
  deliveryFee: number;
  setDeliveryFee: (fee: number) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      vendorId: null,
      vendorName: null,
      deliveryFee: 500,
      addItem: (item, vendorId, vendorName) => {
        const { items, vendorId: currentVendor } = get();
        if (currentVendor && currentVendor !== vendorId) {
          set({ items: [item], vendorId, vendorName });
          return;
        }
        const existing = items.find((i) => i._id === item._id);
        if (existing) {
          set({ items: items.map((i) => i._id === item._id ? { ...i, qty: i.qty + 1 } : i) });
        } else {
          set({ items: [...items, { ...item, qty: 1 }], vendorId, vendorName });
        }
      },
      removeItem: (id) => {
        const items = get().items.filter((i) => i._id !== id);
        set({ items, ...(items.length === 0 && { vendorId: null, vendorName: null }) });
      },
      updateQty: (id, qty) => {
        if (qty <= 0) { get().removeItem(id); return; }
        set({ items: get().items.map((i) => i._id === id ? { ...i, qty } : i) });
      },
      clearCart: () => set({ items: [], vendorId: null, vendorName: null }),
      total: () => get().items.reduce((acc, i) => acc + i.price * i.qty, 0),
      setDeliveryFee: (fee) => set({ deliveryFee: fee }),
    }),
    { name: 'northeats-cart' }
  )
);
