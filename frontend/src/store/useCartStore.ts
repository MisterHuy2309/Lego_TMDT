import { create } from 'zustand';
import { cartService } from '@/types/cart.service';
import { CartItem } from '@/types/cart.type';

interface CartState {
  items: CartItem[];
  loading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (skuId: string, quantity?: number) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  loading: false,

  // 1. Tải danh sách giỏ hàng
  fetchCart: async () => {
    try {
      set({ loading: true });
      const data = await cartService.getCart();

      // Bắt trường hợp backend trả về trực tiếp mảng hoặc bọc trong { items: [] }
      const cartItems: CartItem[] = Array.isArray(data)
        ? data
        : (data as any)?.items || [];

      set({ items: cartItems });
    } catch (error) {
      console.error('Lỗi lấy thông tin giỏ hàng:', error);
      set({ items: [] });
    } finally {
      set({ loading: false });
    }
  },

  // 2. Thêm sản phẩm vào giỏ
  addItem: async (skuId: string, quantity: number = 1) => {
    try {
      await cartService.addToCart({ sku_id: skuId, quantity });
      // Thêm thành công -> Sync lại giỏ hàng mới nhất từ server
      await get().fetchCart();
    } catch (error) {
      console.error('Lỗi thêm sản phẩm vào giỏ:', error);
      throw error; // Re-throw để Component phía trên (ProductDetailPage) bắt lỗi và hiển thị toast/alert
    }
  },

  // 3. Cập nhật số lượng (Optimistic Update)
  updateQuantity: async (cartItemId: string, quantity: number) => {
    if (quantity < 1) return;

    const previousItems = get().items;

    // Cập nhật giao diện lập tức cho trải nghiệm mượt mà
    set({
      items: previousItems.map((item) =>
        item.id === cartItemId ? { ...item, quantity } : item
      ),
    });

    try {
      await cartService.updateQuantity(cartItemId, quantity);
    } catch (error: any) {
      console.error('Lỗi cập nhật số lượng:', error);

      // Rollback về trạng thái cũ nếu server báo lỗi (vd: hết hàng)
      set({ items: previousItems });

      const serverMessage = error.response?.data?.message;
      const errorText = Array.isArray(serverMessage)
        ? serverMessage.join(', ')
        : serverMessage || 'Không thể cập nhật số lượng!';

      alert(`Cảnh báo: ${errorText}`);
    }
  },

  // 4. Xóa món hàng khỏi giỏ (Optimistic Update)
  removeItem: async (cartItemId: string) => {
    const previousItems = get().items;

    // Xóa khỏi UI ngay lập tức
    set((state) => ({
      items: state.items.filter((item) => item.id !== cartItemId),
    }));

    try {
      await cartService.removeItem(cartItemId);
    } catch (error) {
      console.error('Lỗi xóa sản phẩm khỏi giỏ:', error);
      // Rollback lại nếu server xóa thất bại
      set({ items: previousItems });
    }
  },
}));