import api from '@/lib/axios';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface AdminOrderItem {
  id: string;
  quantity: number;
  price?: number;
  price_at_purchase?: number;
  sku?: {
    sku_code: string;
    box_condition?: string;
    product?: {
      id?: string;
      name: string;
      slug: string;
      product_images?: { image_url: string; is_primary?: boolean }[];
    };
  };
}

export interface AdminOrder {
  id: string;
  order_code?: string;
  user_id: string;
  address_id?: string;
  total_amount: number;
  discount_amount?: number;
  shipping_fee?: number;
  status: OrderStatus | string;
  payment_method: string;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
  };
  address?: {
    recipient_name: string;
    phone: string;
    street?: string;
    ward?: string;
    district?: string;
    city?: string;
  };
  order_items?: AdminOrderItem[];
}

export interface AdminOrdersResponse {
  orders: AdminOrder[];
  total_revenue: number;
  total_orders: number;
  delivered_orders_count: number;
  pending_orders_count: number;
}

export const adminOrdersService = {
  getAllOrders: async (): Promise<AdminOrdersResponse> => {
    const res = await api.get('/orders/admin/all');
    return res.data;
  },

  updateStatus: async (
    orderId: string,
    status: OrderStatus | string,
  ): Promise<AdminOrder> => {
    const res = await api.patch(`/orders/admin/${orderId}/status`, { status });
    return res.data;
  },
};

export default adminOrdersService;