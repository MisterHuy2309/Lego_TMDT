import { ProductSku } from './product.type';

export interface DiscountInfo {
  id?: string;
  code?: string;
  discount_type?: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discount_value?: number;
  start_date?: string | Date;
  end_date?: string | Date;
  is_active?: boolean;
}

export interface CartProductImage {
  id?: string;
  image_url: string;
  is_primary?: boolean;
}

export interface CartProduct {
  id?: string;
  name: string;
  slug: string;
  item_number?: string;
  base_price?: number;
  discount_id?: string | null;
  discount?: DiscountInfo | null;
  product_images?: CartProductImage[];
}

export interface CartItem {
  id: string;
  user_id?: string;
  sku_id: string;
  quantity: number;
  price?: number;
  original_price?: number;
  has_discount?: boolean;
  discount_label?: string;
  discount_info?: DiscountInfo | null;
  stock_quantity?: number;

  // Thuộc tính định dạng phẳng từ Backend CartService
  product_name?: string;
  product_slug?: string;
  item_number?: string;
  image_url?: string | null;
  item_subtotal?: number;
  box_condition?: string;

  // Quan hệ lồng nhau từ Prisma (SKU -> Product -> Discount / Images)
  sku?: ProductSku & {
    sku_code?: string;
    box_condition?: string;
    price?: number;
    stock_quantity?: number;
    product?: CartProduct;
  };
}

export interface AddToCartDto {
  sku_id: string;
  quantity: number;
}

export interface CreateOrderDto {
  address_id: string;
  payment_method: 'COD' | 'VNPAY' | 'ZALOPAY' | string;
  discount_id?: string | null;
  discount_code?: string;
  shipping_fee?: number;
  notes?: string;
}