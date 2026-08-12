import api from '@/lib/axios';

export interface ReviewMedia {
  id: string;
  media_url: string;
  media_type: 'IMAGE' | 'VIDEO';
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  order_item_id: string;
  product_id: string;
  user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  media?: ReviewMedia[];
}

export interface ReviewResponse {
  data: Review[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
  stars_summary: Record<number, number>;
}

export const reviewsService = {
  // 1. Lấy danh sách bình luận công khai của 1 sản phẩm
  getProductReviews: async (
    productId: string,
    page = 1,
    limit = 10,
    rating?: number,
  ): Promise<ReviewResponse> => {
    const res = await api.get(`/reviews/product/${productId}`, {
      params: { page, limit, rating },
    });
    return res.data;
  },

  // 2. Gửi bình luận mới (dùng FormData tải kèm tối đa 5 file ảnh/video)
  createReview: async (formData: FormData): Promise<Review> => {
    const res = await api.post('/reviews', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // 3. Chỉnh sửa bình luận
  updateReview: async (reviewId: string, formData: FormData): Promise<Review> => {
    const res = await api.patch(`/reviews/${reviewId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // 4. Xóa bình luận
  deleteReview: async (reviewId: string): Promise<any> => {
    const res = await api.delete(`/reviews/${reviewId}`);
    return res.data;
  },
};

export default reviewsService;