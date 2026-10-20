import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  deliveryFee?: number;
  category: string;
  imageUrl: string;
  images?: string[];
  stockQuantity: number;
  isTopSelling?: boolean;
  isExclusive?: boolean;
  isPromotional?: boolean;
  rating: number;
  reviewCount: number;
  unit: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  buyNowItems: CartItem[] | null;
  addItem: (product: Product, quantity?: number) => void;
  setBuyNowItem: (product: Product, quantity?: number) => void;
  clearBuyNowItems: () => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getTotalDeliveryFee: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      buyNowItems: null,
      
      addItem: (product, quantity = 1) => {
        set((state) => {
          const existingItem = state.items.find(item => item.product.id === product.id);
          if (existingItem) {
            return {
              items: state.items.map(item =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }
          return { items: [...state.items, { product, quantity }] };
        });
      },

      setBuyNowItem: (product, quantity = 1) => {
        set({ buyNowItems: [{ product, quantity }] });
      },

      clearBuyNowItems: () => set({ buyNowItems: null }),
      
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter(item => item.product.id !== productId),
        }));
      },
      
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map(item =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        }));
      },
      
      clearCart: () => set({ items: [] }),
      
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      
      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0
        );
      },
      
      getTotalDeliveryFee: () => {
        return get().items.reduce(
          (total, item) => total + (Number(item.product.deliveryFee) || 0) * item.quantity,
          0
        );
      },
    }),
    {
      name: 'grocery-cart',
    }
  )
);
