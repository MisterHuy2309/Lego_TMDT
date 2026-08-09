import { api } from '@/lib/axios';

export const ordersService = {
  // Lấy danh sách đơn hàng của tôi
  getMyOrders: async () => {
    try {
      const response = await api.get('/api/v1/orders/my-orders');
      return response.data || [];
    } catch (error) {
      console.error('Lỗi lấy danh sách đơn hàng:', error);
      return []; // Nếu chưa đăng nhập hoặc lỗi API, trả mảng rỗng thay vì ném Error
    }
  },

  // Đăng bài viết đánh giá kèm upload nhiều file (Ảnh/Video)
  createReview: async (formData: FormData) => {
    const response = await api.post('/api/v1/reviews', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};