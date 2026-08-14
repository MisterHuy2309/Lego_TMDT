import api from '@/lib/axios';

export interface AdminOrderItem {
  id: string;
  quantity: number;
  price: number;
  sku?: {
    sku_code: string;
    box_condition?: string;
    product?: {
      name: string;
      slug: string;
    };
  };
}

export interface AdminOrder {
  id: string;
  order_code?: string;
  user_id: string;
  address_id?: string;
  total_amount: number;
  status: 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';
  payment_method: string;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
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

  updateStatus: async (orderId: string, status: string): Promise<AdminOrder> => {
    const res = await api.patch(`/orders/admin/${orderId}/status`, { status });
    return res.data;
  },
};

export default adminOrdersService;