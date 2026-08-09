import { ProductSku } from './product.type';

export interface CartItem {
  id: string;
  user_id: string;
  sku_id: string;
  quantity: number;
  sku?: ProductSku & {
    product?: {
      id: string;
      name: string;
      slug: string;
      product_images?: { image_url: string; is_primary: boolean }[];
    };
  };
}

export interface AddToCartDto {
  sku_id: string;
  quantity: number;
}

export interface CreateOrderDto {
  address_id: string;
  payment_method: 'COD' | 'VNPAY' | 'ZALOPAY';
  discount_code?: string;
  notes?: string;
}

export interface CartItem {
  id: string;
  sku_id: string;
  quantity: number;
  price?: number;
  
  // 🟢 Bổ sung các thuộc tính mà Backend CartService định dạng trả về:
  image_url?: string | null;
  box_condition?: string;
  product_name?: string;
  product_slug?: string;
  item_number?: string;
  item_subtotal?: number;
}