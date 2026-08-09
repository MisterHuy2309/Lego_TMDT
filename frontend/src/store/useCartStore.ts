import { create } from 'zustand';
import { cartService } from '@/types/cart.service';
import { CartItem } from '@/types/cart.type';

interface CartState {
  items: CartItem[];
  loading: boolean;
  fetchCart: () => Promise<void>;
  // 🟢 Khai báo hàm addItem vào Interface
  addItem: (skuId: string, quantity?: number) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  loading: false,

  fetchCart: async () => {
    try {
      set({ loading: true });
      const data = await cartService.getCart();
      const cartItems: CartItem[] = Array.isArray(data) ? data : [];
      set({ items: cartItems });
    } catch (error) {
      console.error('Lỗi lấy thông tin giỏ hàng:', error);
      set({ items: [] });
    } finally {
      set({ loading: false });
    }
  },

  // 🟢 HÀM THÊM SẢN PHẨM VÀO GIỎ (addItem)
  addItem: async (skuId: string, quantity: number = 1) => {
    try {
      await cartService.addToCart({ sku_id: skuId, quantity });
      // Sau khi thêm thành công -> Tải lại danh sách giỏ hàng mới nhất
      await get().fetchCart();
    } catch (error) {
      console.error('Lỗi thêm sản phẩm vào giỏ:', error);
      throw error;
    }
  },

  updateQuantity: async (cartItemId: string, quantity: number) => {
    if (quantity < 1) return;

    const previousItems = get().items;

    set({
      items: previousItems.map((item) =>
        item.id === cartItemId ? { ...item, quantity } : item
      ),
    });

    try {
      await cartService.updateQuantity(cartItemId, quantity);
    } catch (error: any) {
      console.error('Lỗi cập nhật số lượng:', error);
      set({ items: previousItems });

      const serverMessage = error.response?.data?.message;
      const errorText = Array.isArray(serverMessage)
        ? serverMessage.join(', ')
        : serverMessage || 'Không thể cập nhật số lượng!';

      alert(`Cảnh báo: ${errorText}`);
    }
  },

  removeItem: async (cartItemId: string) => {
    const previousItems = get().items;

    set((state) => ({
      items: state.items.filter((item) => item.id !== cartItemId),
    }));

    try {
      await cartService.removeItem(cartItemId);
    } catch (error) {
      console.error('Lỗi xóa sản phẩm khỏi giỏ:', error);
      set({ items: previousItems });
    }
  },
}));