import { api } from '@/lib/axios';

export interface CreateProductDto {
  name: string;
  slug: string;
  category_id?: string;
  description?: string;
  item_number?: string;
  piece_count?: number;
  min_age?: number;
  base_price: number;
  images: { image_url: string; is_primary: boolean }[];
  skus: { sku_code: string; box_condition: string; price: number; stock_quantity: number }[];
}

export const productsService = {
  // 1. Lấy danh sách sản phẩm -> GET /api/v1/products
  getProducts: async (params?: any) => {
    const res = await api.get('/products', { params });
    return res.data;
  },

  // 2. Lấy chi tiết theo Slug -> GET /api/v1/products/slug/:slug
  getProductBySlug: async (slug: string) => {
    const res = await api.get(`/products/slug/${slug}`);
    return res.data;
  },

  // 3. Tạo sản phẩm mới -> POST /api/v1/products
  createProduct: async (data: CreateProductDto) => {
    const res = await api.post('/products', data);
    return res.data;
  },

  // 4. Cập nhật sản phẩm -> PATCH /api/v1/products/:id
  updateProduct: async (id: string, data: Partial<CreateProductDto>) => {
    const res = await api.patch(`/products/${id}`, data);
    return res.data;
  },

  // 5. Xóa sản phẩm -> DELETE /api/v1/products/:id
  deleteProduct: async (id: string) => {
    const res = await api.delete(`/products/${id}`);
    return res.data;
  },
};

export default productsService;