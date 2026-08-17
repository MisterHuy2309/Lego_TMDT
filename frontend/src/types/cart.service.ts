import api from '@/lib/axios';
import { AddToCartDto, CartItem, CreateOrderDto } from '@/types/cart.type';

export const cartService = {
  // 1. Lấy giỏ hàng -> GET /api/v1/cart
  getCart: async (): Promise<CartItem[]> => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (!token || token === 'undefined' || token === 'null' || token === '""') {
        return [];
      }
    }

    try {
      const response = await api.get('/cart');

      if (response.data && Array.isArray(response.data.items)) {
        return response.data.items;
      }
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      if (error.response?.status === 401) {
        return [];
      }
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

  // 6. Tạo link thanh toán VNPay -> POST /api/v1/payments/create-url
  createPaymentUrl: async (orderId: string, paymentMethod?: string) => {
    const response = await api.post('/payments/create-url', {
      orderId,
      paymentMethod,
    });
    return response.data;
  },
};

export default cartService;