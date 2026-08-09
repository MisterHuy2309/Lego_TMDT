import { Category } from '@/services/categories.service';

export interface ProductImage {
  id?: string;
  product_id?: string;
  image_url: string;
  is_primary?: boolean;
}

export interface ProductSku {
  id?: string;
  product_id?: string;
  sku_code: string;
  box_condition?: string;
  price: number | string;
  stock_quantity: number;
}

export interface Product {
  id: string;
  category_id?: string | null; // 🟢 Bổ sung thuộc tính category_id ở đây
  name: string;
  slug: string;
  description?: string | null;
  item_number?: string | null;
  piece_count?: number | null;
  min_age?: number | null;
  base_price: number | string;
  rating_avg?: number | string;
  created_at?: string;

  // Relations
  category?: Category | null;
  product_images?: ProductImage[];
  product_skus?: ProductSku[];
}