'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
  XCircle,
  ShoppingBag,
  Loader2,
  Calendar,
  MapPin,
  Trash2
} from 'lucide-react';

interface OrderItem {
  id: string;
  quantity: number;
  price_at_purchase: number;
  sku?: {
    sku_code?: string;
    box_condition?: string;
    product?: {
      name: string;
      slug: string;
      product_images?: { image_url: string; is_primary?: boolean }[];
    };
  };
}

interface Order {
  id: string;
  order_code: string;
  status: string; // PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED
  total_amount: number;
  discount_amount?: number;
  shipping_fee?: number;
  payment_method: string;
  created_at: string;
  address?: {
    recipient_name: string;
    phone: string;
    street?: string;
    ward?: string;
    district?: string;
    city?: string;
  };
  order_items: OrderItem[];
}

export default function MyOrdersPage() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('ALL');

  // Gỡ bỏ class dark nếu dính từ Admin
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Kiểm tra xác thực & tải danh sách đơn hàng
  useEffect(() => {
    const hasToken = token || (typeof window !== 'undefined' && localStorage.getItem('access_token'));
    if (!hasToken) {
      router.replace('/login');
      return;
    }
    fetchMyOrders();
  }, [token, router]);

  const fetchMyOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders/my-orders');
      const data = Array.isArray(res.data) ? res.data : res.data.orders || [];
      setOrders(data);
    } catch (err) {
      console.error('Lỗi lấy danh sách đơn hàng của tôi:', err);
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ Hàm xóa lịch sử đơn hàng
  const handleDeleteHistory = async (orderId: string, orderCode: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa lịch sử đơn hàng #${orderCode || orderId.slice(0, 8)}?`)) {
      return;
    }

    setDeletingId(orderId);
    try {
      await api.delete(`/orders/my-orders/${orderId}`);
      // Cập nhật UI ngay lập tức
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      alert('Đã xóa lịch sử đơn hàng thành công!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xóa lịch sử đơn hàng!');
    } finally {
      setDeletingId(null);
    }
  };

  // 4 bước tiến trình chính xác
  const steps = [
    { key: 'PENDING', label: 'Đang đợi chấp nhận', icon: Clock, desc: 'Shop đang duyệt đơn' },
    { key: 'CONFIRMED', label: 'Đã xác nhận đơn hàng', icon: CheckCircle2, desc: 'Đang chuẩn bị hàng' },
    { key: 'SHIPPED', label: 'Đang giao hàng', icon: Truck, desc: 'Đang giao hàng' },
    { key: 'DELIVERED', label: 'Đã giao hàng', icon: PackageCheck, desc: 'Đã giao hàng' },
  ];

  // Tính vị trí bước hiện tại
  const getStepIndex = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 0;
      case 'CONFIRMED':
      case 'PROCESSING':
        return 1;
      case 'SHIPPED':
        return 2;
      case 'DELIVERED':
        return 3;
      default:
        return -1;
    }
  };

  // Lọc danh sách theo Tab
  const filteredOrders = orders.filter((o) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'PENDING') return o.status === 'PENDING';
    if (activeFilter === 'CONFIRMED') return o.status === 'CONFIRMED' || o.status === 'PROCESSING';
    if (activeFilter === 'SHIPPED') return o.status === 'SHIPPED';
    if (activeFilter === 'DELIVERED') return o.status === 'DELIVERED';
    if (activeFilter === 'CANCELLED') return o.status === 'CANCELLED';
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-red-600 mb-3" />
        <p className="text-sm font-semibold text-slate-500">Đang tải lịch sử đơn hàng của bạn...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Trang */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900">Đơn Hàng Của Tôi</h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Theo dõi quy trình đặt hàng và quản lý lịch sử mua LEGO
            </p>
          </div>
          <Link
            href="/products"
            className="px-5 py-3 bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-slate-950 font-black text-xs md:text-sm rounded-2xl transition shadow-sm flex items-center justify-center gap-2 w-fit"
          >
            <ShoppingBag className="w-4 h-4" /> Tiếp Tục Mua Sắm
          </Link>
        </div>

        {/* Tab Lọc Trạng Thái Đơn */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'ALL', label: 'Tất cả đơn' },
            { id: 'PENDING', label: 'Đang đợi duyệt' },
            { id: 'CONFIRMED', label: 'Đã xác nhận' },
            { id: 'SHIPPED', label: 'Đang giao hàng' },
            { id: 'DELIVERED', label: 'Đã giao' },
            { id: 'CANCELLED', label: 'Đã hủy' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition shadow-sm ${
                activeFilter === tab.id
                  ? 'bg-red-600 text-white shadow-red-500/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Danh Sách Đơn Hàng */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm space-y-4">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
              <Package className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Không tìm thấy đơn hàng nào</h3>
              <p className="text-xs text-slate-400 mt-1">Bạn chưa có đơn hàng nào trong trạng thái đã chọn.</p>
            </div>
            <Link
              href="/products"
              className="inline-block px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition"
            >
              Khám Phá Cửa Hàng
            </Link>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const currentStepIdx = getStepIndex(order.status);
            const isCancelled = order.status === 'CANCELLED';
            const isDelivered = order.status === 'DELIVERED';
            const canDeleteHistory = isCancelled || isDelivered; // 🟢 Chỉ cho xóa lịch sử khi đã HỦY hoặc ĐÃ GIAO
            const isDeleting = deletingId === order.id;

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden hover:shadow-md transition"
              >
                {/* Header Card Đơn Hàng */}
                <div className="p-5 md:p-6 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-sm bg-slate-900 text-white px-3 py-1 rounded-xl shadow-sm">
                      #{order.order_code || order.id.slice(0, 8)}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(order.created_at).toLocaleDateString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  {/* Badge Trạng Thái Tổng Thể & Nút Xóa Lịch Sử */}
                  <div className="flex items-center gap-2">
                    {isCancelled ? (
                      <span className="bg-red-50 text-red-600 font-bold px-3 py-1 rounded-xl text-xs flex items-center gap-1.5 border border-red-100">
                        <XCircle className="w-3.5 h-3.5" /> Đã Hủy Đơn
                      </span>
                    ) : isDelivered ? (
                      <span className="bg-emerald-50 text-emerald-600 font-bold px-3 py-1 rounded-xl text-xs flex items-center gap-1.5 border border-emerald-100">
                        <PackageCheck className="w-3.5 h-3.5" /> Giao Hàng Thành Công
                      </span>
                    ) : (
                      <span className="bg-amber-50 text-amber-600 font-bold px-3 py-1 rounded-xl text-xs flex items-center gap-1.5 border border-amber-100">
                        <Clock className="w-3.5 h-3.5" /> Đang Xử Lý Đơn Hàng
                      </span>
                    )}

                    {/* 🗑️ NÚT XÓA LỊCH SỬ ĐƠN HÀNG (KHI ĐÃ HỦY HOẶC ĐÃ GIAO) */}
                    {canDeleteHistory && (
                      <button
                        onClick={() => handleDeleteHistory(order.id, order.order_code)}
                        disabled={isDeleting}
                        className="p-1.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 transition flex items-center gap-1 text-xs font-bold px-2.5 border border-slate-200"
                        title="Xóa lịch sử đơn hàng này"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        <span className="hidden sm:inline">Xóa lịch sử</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* THANH TIẾN TRÌNH 4 BƯỚC ĐẶT HÀNG */}
                {!isCancelled ? (
                  <div className="p-6 md:p-8 bg-white border-b border-slate-50">
                    <div className="relative flex items-center justify-between">
                      {/* Line nền */}
                      <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-slate-100 -translate-y-1/2 z-0" />
                      
                      {/* Line active */}
                      <div
                        className="absolute top-1/2 left-0 h-1.5 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-500"
                        style={{
                          width: `${(Math.max(0, currentStepIdx) / (steps.length - 1)) * 100}%`
                        }}
                      />

                      {/* 4 Mốc biểu tượng */}
                      {steps.map((step, idx) => {
                        const Icon = step.icon;
                        const isDone = currentStepIdx >= idx;
                        const isCurrent = currentStepIdx === idx;

                        return (
                          <div key={step.key} className="relative z-10 flex flex-col items-center group">
                            <div
                              className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md ${
                                isCurrent
                                  ? 'bg-emerald-500 text-white scale-110 ring-4 ring-emerald-100 animate-pulse'
                                  : isDone
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-white text-slate-300 border-2 border-slate-200'
                              }`}
                            >
                              <Icon className="w-5 h-5 md:w-6 md:h-6" />
                            </div>

                            <div className="text-center mt-2.5">
                              <span
                                className={`text-[11px] md:text-xs font-black block whitespace-nowrap ${
                                  isCurrent
                                    ? 'text-emerald-600'
                                    : isDone
                                    ? 'text-slate-800'
                                    : 'text-slate-400'
                                }`}
                              >
                                {step.label}
                              </span>
                              <span className="text-[9px] text-slate-400 hidden sm:block mt-0.5 font-medium">
                                {step.desc}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-red-50/60 border-b border-red-100 flex items-center justify-between text-xs text-red-600 font-medium px-6">
                    <span>
                      Đơn hàng đã bị hủy bởi Quản trị viên/Hệ thống và được lưu vào lịch sử.
                    </span>
                    <span className="font-bold text-[11px] text-red-700 bg-red-100 px-2 py-0.5 rounded-lg">
                      Lịch sử hủy
                    </span>
                  </div>
                )}

                {/* Danh Sách Mặt Hàng Trong Đơn */}
                <div className="p-5 md:p-6 space-y-4">
                  {order.order_items?.map((item) => {
                    const product = item.sku?.product;
                    const rawImg =
                      product?.product_images?.find((img) => img.is_primary)?.image_url ||
                      product?.product_images?.[0]?.image_url ||
                      'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=200';

                    const backendHost = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
                    const primaryImg =
                      rawImg.startsWith('http') || rawImg.startsWith('data:')
                        ? rawImg
                        : `${backendHost}${rawImg.startsWith('/') ? '' : '/'}${rawImg}`;

                    return (
                      <div key={item.id} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 bg-slate-50 rounded-2xl border border-slate-100 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                            <img
                              src={primaryImg}
                              alt={product?.name || 'Sản phẩm Lego'}
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                          <div>
                            <Link
                              href={product?.slug ? `/products/${product.slug}` : '#'}
                              className="font-bold text-slate-900 text-sm hover:text-red-600 transition line-clamp-1"
                            >
                              {product?.name || 'Mô hình LEGO'}
                            </Link>
                            <div className="text-xs text-slate-400 mt-0.5 font-medium">
                              Tình trạng: <span className="font-semibold text-slate-700">{item.sku?.box_condition || 'Mới 100%'}</span> • SL: <span className="font-black text-slate-900">x{item.quantity}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-black text-sm text-slate-900">
                            {Number(item.price_at_purchase).toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Tổng Tiền & Địa Chỉ Nhận Hàng */}
                <div className="p-5 md:p-6 bg-slate-50/50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                  {/* Địa chỉ giao hàng */}
                  <div className="text-xs text-slate-500 max-w-sm space-y-1">
                    {order.address && (
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                        <span>
                          Giao đến: <strong>{order.address.recipient_name}</strong> ({order.address.phone}) -{' '}
                          {[order.address.street, order.address.ward, order.address.district, order.address.city]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tổng tiền thanh toán */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 uppercase">Tổng thanh toán:</span>
                    <span className="text-xl md:text-2xl font-black text-red-600">
                      {Number(order.total_amount).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}