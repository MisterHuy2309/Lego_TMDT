import api from '@/lib/axios';
import { AddToCartDto, CartItem, CreateOrderDto } from '@/types/cart.type';

export const cartService = {
  // 1. Lấy giỏ hàng -> GET /api/v1/cart
  getCart: async (): Promise<CartItem[]> => {
    try {
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

  // 2. Thêm vào giỏ -> POST /api/v1/cart
  addToCart: async (data: AddToCartDto): Promise<CartItem> => {
    const response = await api.post('/cart', data);
    return response.data;
  },

  // 3. Cập nhật số lượng -> PATCH /api/v1/cart/:id
  updateQuantity: async (cartItemId: string, quantity: number) => {
    const response = await api.patch(`/cart/${cartItemId}`, {
      quantity: Number(quantity),
    });
    return response.data;
  },

  // 4. Xóa khỏi giỏ -> DELETE /api/v1/cart/:id
  removeFromCart: async (cartItemId: string) => {
    const response = await api.delete(`/cart/${cartItemId}`);
    return response.data;
  },

  removeItem: async (cartItemId: string) => {
    const response = await api.delete(`/cart/${cartItemId}`);
    return response.data;
  },

  // 5. Tạo đơn hàng -> POST /api/v1/orders
  createOrder: async (data: CreateOrderDto) => {
    const response = await api.post('/orders', data);
    return response.data;
  },
};

export default cartService;