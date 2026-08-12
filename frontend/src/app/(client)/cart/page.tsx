'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Loader2 } from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const { items, loading, fetchCart, updateQuantity, removeItem } = useCartStore();

  useEffect(() => {
    const hasToken = token || (typeof window !== 'undefined' && localStorage.getItem('access_token'));
    if (hasToken) {
      fetchCart();
    }
  }, [token, fetchCart]);

  // 🟢 1. Hàm trích xuất Giá tiền
  const getItemPrice = (item: any): number => {
    if (item.price && Number(item.price) > 0) return Number(item.price);
    if (item.sku?.price && Number(item.sku.price) > 0) return Number(item.sku.price);
    if (item.sku?.product?.base_price) return Number(item.sku.product.base_price);
    if (item.product?.base_price) return Number(item.product.base_price);
    return 0;
  };

  // 🟢 2. Hàm trích xuất Tên sản phẩm
  const getItemName = (item: any): string => {
    return item.product_name || item.sku?.product?.name || item.product?.name || 'Bộ LEGO';
  };

  // 🟢 3. Hàm lấy Slug sản phẩm
  const getItemSlug = (item: any): string => {
    return item.product_slug || item.sku?.product?.slug || item.product?.slug || '';
  };

  // 🟢 4. Hàm trích xuất Stock (Tồn kho) cực kỳ chính xác
  const getItemStock = (item: any): number => {
    const stockCandidate =
      item.sku?.stock ??
      item.product?.stock ??
      item.sku?.product?.stock ??
      item.stock ??
      item.product_stock ??
      item.sku?.stock_quantity;

    if (typeof stockCandidate !== 'undefined' && stockCandidate !== null) {
      return Number(stockCandidate);
    }

    return 99; // Fallback nếu hoàn toàn không có dữ liệu stock
  };

  // 🟢 Tính tổng tiền đơn hàng
  const totalAmount = items.reduce((sum, item) => {
    const price = getItemPrice(item);
    return sum + price * (item.quantity || 1);
  }, 0);

  // ✅ Tiến hành đặt hàng
  const handleProceedToCheckout = () => {
    const hasToken = token || (typeof window !== 'undefined' && localStorage.getItem('access_token'));
    if (!hasToken) {
      alert('Vui lòng đăng nhập để tiến hành đặt hàng!');
      router.push('/login');
      return;
    }
    router.push('/checkout');
  };

  if (loading && items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 flex flex-col justify-center items-center text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-red-600 mb-2" />
        <span>Đang tải giỏ hàng...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4">
        <div className="max-w-md mx-auto bg-white p-8 rounded-3xl text-center shadow-sm border border-slate-100">
          <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Giỏ Hàng Đang Trống</h2>
          <p className="text-slate-500 text-sm mb-6">Bạn chưa thêm bộ Lego nào vào giỏ hàng cả.</p>
          <Link
            href="/products"
            className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition shadow"
          >
            Khám Phá Lego Ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-black text-slate-800 mb-6">Giỏ Hàng Của Bạn</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Danh Sách Món Hàng */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              // 🟢 Lấy ID chuẩn của Cart Item (bắt sạch các khả năng từ backend)
              const itemId =
                item.id ||
                (item as any).cart_item_id ||
                (item as any)._id ||
                (item as any).cartItemId ||
                (item as any).sku_id;

              const productName = getItemName(item);
              const productSlug = getItemSlug(item);
              const price = getItemPrice(item);
              const maxStock = getItemStock(item);

              // Phân tích điều kiện kịch trần
              const isMaxStockReached = item.quantity >= maxStock;

              // Lấy image_url chuẩn:
              const rawImgUrl =
                (item as any).image_url ||
                item.sku?.product?.product_images?.find((i: any) => i.is_primary)?.image_url ||
                item.sku?.product?.product_images?.[0]?.image_url ||
                'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=500';

              const imgUrl =
                rawImgUrl.startsWith('http') || rawImgUrl.startsWith('data:')
                  ? rawImgUrl
                  : `http://localhost:3000${rawImgUrl.startsWith('/') ? '' : '/'}${rawImgUrl}`;

              return (
                <div
                  key={itemId || Math.random()}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4"
                >
                  <div className="w-20 h-20 bg-slate-50 rounded-xl overflow-hidden flex-shrink-0 p-1 border border-slate-100">
                    <img
                      src={imgUrl}
                      alt={productName}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=500';
                      }}
                    />
                  </div>

                  <div className="flex-grow">
                    <Link
                      href={`/products/${productSlug}`}
                      className="font-bold text-slate-800 hover:text-red-600 line-clamp-1 text-sm transition"
                    >
                      {productName}
                    </Link>

                    <span className="text-xs text-slate-400 block mt-0.5">
                      Phân loại: {(item as any).box_condition || item.sku?.box_condition || 'Mới 100%'}
                    </span>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-black text-red-600">
                        {price.toLocaleString('vi-VN')} đ
                      </span>

                      {/* Hiển thị cảnh báo số lượng tồn kho */}
                      {isMaxStockReached && (
                        <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                          Tối đa trong kho: {maxStock}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Nút Tăng Giảm Số Lượng */}
                  <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <button
                      type="button"
                      onClick={() => {
                        if (!itemId) {
                          console.error('❌ itemId bị undefined trong item:', item);
                          return;
                        }
                        updateQuantity(itemId, item.quantity - 1);
                      }}
                      disabled={item.quantity <= 1}
                      className="p-2 hover:bg-slate-100 disabled:opacity-20 disabled:cursor-not-allowed text-slate-600 transition"
                      title="Giảm số lượng"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <span className="px-3 text-sm font-bold text-slate-800 select-none">
                      {item.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        if (!itemId) {
                          console.error('❌ itemId bị undefined trong item:', item);
                          return;
                        }
                        if (isMaxStockReached) return;
                        updateQuantity(itemId, item.quantity + 1);
                      }}
                      disabled={isMaxStockReached}
                      className={`p-2 transition ${
                        isMaxStockReached
                          ? 'opacity-20 bg-slate-100 cursor-not-allowed text-slate-400'
                          : 'hover:bg-slate-100 text-slate-600'
                      }`}
                      title={isMaxStockReached ? `Trong kho chỉ còn ${maxStock} sản phẩm` : 'Tăng số lượng'}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Nút Xóa khỏi giỏ */}
                  <button
                    onClick={() => {
                      if (!itemId) {
                        console.error('❌ itemId bị undefined trong item:', item);
                        return;
                      }
                      removeItem(itemId);
                    }}
                    className="p-2 text-slate-400 hover:text-red-600 transition"
                    title="Xóa khỏi giỏ hàng"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Tổng Tiền & Thanh Toán */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit space-y-4">
            <h2 className="text-lg font-bold text-slate-800 border-b pb-3">Tóm Tắt Đơn Hàng</h2>

            <div className="flex justify-between text-slate-600 text-sm">
              <span>Tạm tính</span>
              <span className="font-bold text-slate-800">{totalAmount.toLocaleString('vi-VN')} đ</span>
            </div>

            <div className="flex justify-between text-slate-600 text-sm">
              <span>Phí vận chuyển</span>
              <span className="font-bold text-green-600">Miễn phí</span>
            </div>

            <div className="border-t pt-3 flex justify-between items-center">
              <span className="font-bold text-slate-800">Tổng tiền</span>
              <span className="text-2xl font-black text-red-600">
                {totalAmount.toLocaleString('vi-VN')} đ
              </span>
            </div>

            <button
              onClick={handleProceedToCheckout}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg flex items-center justify-center gap-2"
            >
              Tiến Hành Đặt Hàng <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}