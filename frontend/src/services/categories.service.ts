import { api } from '@/lib/axios';

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  image_url?: string | null;
  children?: Category[];
}

export const categoriesService = {
  // 1. Lấy tất cả danh mục -> GET /api/v1/categories
  getAll: async (): Promise<Category[]> => {
    try {
      // 🟢 CHỈ DÙNG '/categories' VÌ AXIOS BASEURL ĐÃ CÓ /api/v1
      const res = await api.get('/categories');
      return Array.isArray(res.data) ? res.data : res.data?.data || [];
    } catch (error) {
      console.error('Lỗi lấy danh mục:', error);
      return [];
    }
  },

  // 2. Tạo mới danh mục -> POST /api/v1/categories
  create: async (data: { name: string; slug: string; parent_id?: string; image_url?: string }): Promise<Category> => {
    const res = await api.post('/categories', data);
    return res.data;
  },

  // 3. Cập nhật (Sửa) danh mục -> PATCH /api/v1/categories/:id
  update: async (id: string, data: { name: string; slug: string; parent_id?: string; image_url?: string }): Promise<Category> => {
    const res = await api.patch(`/categories/${id}`, data);
    return res.data;
  },

  // 4. Xóa danh mục -> DELETE /api/v1/categories/:id
  delete: async (id: string) => {
    const res = await api.delete(`/categories/${id}`);
    return res.data;
  },
};

export default categoriesService;