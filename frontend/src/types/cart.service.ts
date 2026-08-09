import api from '@/lib/axios';
import { AddToCartDto, CartItem, CreateOrderDto } from '@/types/cart.type';

export const cartService = {
  // 1. Lấy giỏ hàng
  getCart: async (): Promise<CartItem[]> => {
    try {
      // 🟢 CHỈ ĐỂ '/cart' VÌ AXIOS BASEURL ĐÃ CÓ /api/v1 RỒI
      const response = await api.get('/cart');

      if (response.data && Array.isArray(response.data.items)) {
        return response.data.items;
      }
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Lỗi lấy giỏ hàng:', error);
      return [];
    }
  },

  // 2. Thêm vào giỏ
  addToCart: async (data: AddToCartDto): Promise<CartItem> => {
    const response = await api.post('/cart', data);
    return response.data;
  },

  // 3. Cập nhật số lượng
  updateQuantity: async (cartItemId: string, quantity: number) => {
    const response = await api.patch(`/cart/${cartItemId}`, {
      quantity: Number(quantity),
    });
    return response.data;
  },

  // 4. Xóa món hàng khỏi giỏ
  removeFromCart: async (cartItemId: string) => {
    const response = await api.delete(`/cart/${cartItemId}`);
    return response.data;
  },

  removeItem: async (cartItemId: string) => {
    const response = await api.delete(`/cart/${cartItemId}`);
    return response.data;
  },

  // 5. Checkout
  createOrder: async (data: CreateOrderDto) => {
    const response = await api.post('/orders', data);
    return response.data;
  },
};

export default cartService;