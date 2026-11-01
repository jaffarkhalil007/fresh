import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  stock_quantity?: number;
  description?: string;
  original_price?: number;
  discount_percentage?: number;
  specifications?: Record<string, string>;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  deliveryFee?: number;
  category: string;
  categories?: string[];
  imageUrl: string;
  images?: string[];
  stockQuantity: number;
  isTopSelling?: boolean;
  isExclusive?: boolean;
  isPromotional?: boolean;
  rating: number;
  reviewCount: number;
  unit: string;
  specifications?: Record<string, string> | null;
  variants?: ProductVariant[] | null;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: ProductVariant;
}

// Composite key: distinguishes same product with different variants in cart
export const cartItemKey = (productId: string, variantId?: string) =>
  variantId ? `${productId}__v__${variantId}` : productId;

// Effective price for a cart item (variant price overrides product price)
export const cartItemPrice = (item: CartItem) =>
  item.selectedVariant?.price ?? item.product.price;

interface CartStore {
  items: CartItem[];
  buyNowItems: CartItem[] | null;
  addItem: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  setBuyNowItem: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  clearBuyNowItems: () => void;
  removeItem: (productId: string, variantId?: string) => void;
  removeItems: (compositeKeys: string[]) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
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

      addItem: (product, quantity = 1, variant?) => {
        set((state) => {
          const key = cartItemKey(product.id, variant?.id);
          const existingItem = state.items.find(
            item => cartItemKey(item.product.id, item.selectedVariant?.id) === key
          );
          if (existingItem) {
            return {
              items: state.items.map(item =>
                cartItemKey(item.product.id, item.selectedVariant?.id) === key
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }
          return { items: [...state.items, { product, quantity, selectedVariant: variant }] };
        });
      },

      setBuyNowItem: (product, quantity = 1, variant?) => {
        set({ buyNowItems: [{ product, quantity, selectedVariant: variant }] });
      },

      clearBuyNowItems: () => set({ buyNowItems: null }),

      removeItem: (productId, variantId?) => {
        const key = cartItemKey(productId, variantId);
        set((state) => ({
          items: state.items.filter(
            item => cartItemKey(item.product.id, item.selectedVariant?.id) !== key
          ),
        }));
      },

      // compositeKeys: array of cartItemKey(...) strings — removes only matching items
      removeItems: (compositeKeys) => {
        const keySet = new Set(compositeKeys);
        set((state) => ({
          items: state.items.filter(
            item => !keySet.has(cartItemKey(item.product.id, item.selectedVariant?.id))
          ),
        }));
      },

      updateQuantity: (productId, quantity, variantId?) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }
        const key = cartItemKey(productId, variantId);
        set((state) => ({
          items: state.items.map(item =>
            cartItemKey(item.product.id, item.selectedVariant?.id) === key
              ? { ...item, quantity }
              : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),

      getTotalPrice: () =>
        get().items.reduce(
          (total, item) => total + cartItemPrice(item) * item.quantity,
          0
        ),

      getTotalDeliveryFee: () =>
        get().items.reduce(
          (total, item) => total + (Number(item.product.deliveryFee) || 0) * item.quantity,
          0
        ),
    }),
    { name: 'grocery-cart' }
  )
);
