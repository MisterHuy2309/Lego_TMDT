'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { CartItem } from '@/types/cart.type';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Loader2,
  Tag,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const { items, loading, fetchCart, updateQuantity, removeItem } = useCartStore();

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    const hasToken = token || (typeof window !== 'undefined' && localStorage.getItem('access_token'));
    if (!hasToken) {
      router.replace('/login');
      return;
    }
    fetchCart();
  }, [token, router, fetchCart]);

  // Tính giá sau giảm
  const calculateItemPrice = (item: CartItem) => {
    const originalPrice = Number(item.sku?.price ?? item.price ?? item.original_price ?? 0);
    const discount = item.sku?.product?.discount ?? item.discount_info;

    if (!discount || discount.is_active === false) {
      return {
        unitPrice: originalPrice,
        originalPrice,
        hasDiscount: false,
        discountLabel: '',
        discountCode: '',
      };
    }

    const now = new Date();
    const isStarted = !discount.start_date || new Date(discount.start_date) <= now;
    const isNotExpired = !discount.end_date || new Date(discount.end_date) >= now;

    if (!isStarted || !isNotExpired) {
      return {
        unitPrice: originalPrice,
        originalPrice,
        hasDiscount: false,
        discountLabel: '',
        discountCode: '',
      };
    }

    const discountVal = Number(discount.discount_value || 0);
    let finalUnitPrice = originalPrice;
    let discountLabel = '';

    if (discount.discount_type === 'PERCENTAGE' || !discount.discount_type) {
      finalUnitPrice = Math.max(0, originalPrice - (originalPrice * discountVal) / 100);
      discountLabel = `-${discountVal}%`;
    } else {
      finalUnitPrice = Math.max(0, originalPrice - discountVal);
      discountLabel = discountVal >= 1000 ? `-${(discountVal / 1000).toFixed(0)}K` : `-${discountVal}đ`;
    }

    return {
      unitPrice: finalUnitPrice,
      originalPrice,
      hasDiscount: true,
      discountLabel,
      discountCode: discount.code || '',
    };
  };

  const handleUpdateQuantity = async (itemId: string, newQty: number) => {
    if (newQty < 1) return;
    setUpdatingId(itemId);
    try {
      await updateQuantity(itemId, newQty);
    } catch (err) {
      console.error('Lỗi cập nhật số lượng:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (itemId: string) => {
    try {
      await removeItem(itemId);
    } catch (err) {
      alert('Không thể xóa sản phẩm khỏi giỏ hàng!');
    }
  };

  let totalOriginalPrice = 0;
  let totalFinalPrice = 0;

  (items || []).forEach((item: CartItem) => {
    const { unitPrice, originalPrice } = calculateItemPrice(item);
    const qty = Number(item.quantity || 1);
    totalOriginalPrice += originalPrice * qty;
    totalFinalPrice += unitPrice * qty;
  });

  const totalSaved = Math.max(0, totalOriginalPrice - totalFinalPrice);

  if (loading && (!items || items.length === 0)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-red-600 mb-3" />
        <p className="text-sm font-semibold text-slate-500">Đang tải giỏ hàng của bạn...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900">Giỏ Hàng Của Bạn</h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Bạn đang có <strong className="text-red-600">{items?.length || 0}</strong> loại mô hình LEGO trong giỏ
            </p>
          </div>
          <Link
            href="/products"
            className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs md:text-sm rounded-2xl transition flex items-center justify-center gap-2 w-fit"
          >
            <ShoppingBag className="w-4 h-4" /> Mua Thêm Bộ Khác
          </Link>
        </div>

        {!items || items.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm space-y-4">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Giỏ hàng của bạn đang trống</h3>
              <p className="text-xs text-slate-400 mt-1">Hãy khám phá và chọn ngay bộ LEGO bạn yêu thích nhé!</p>
            </div>
            <Link
              href="/products"
              className="inline-block px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-sm rounded-2xl shadow-lg transition active:scale-95"
            >
              Khám Phá Cửa Hàng Ngay
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item: CartItem) => {
                const productName = item.sku?.product?.name ?? item.product_name ?? 'Mô hình LEGO';
                const productSlug = item.sku?.product?.slug ?? item.product_slug ?? '';
                const boxCondition = item.sku?.box_condition ?? item.box_condition ?? 'Mới 100%';
                
                const { unitPrice, originalPrice, hasDiscount, discountLabel, discountCode } = calculateItemPrice(item);
                const isUpdating = updatingId === item.id;

                const rawImg =
                  item.image_url ||
                  item.sku?.product?.product_images?.find((img) => img.is_primary)?.image_url ||
                  item.sku?.product?.product_images?.[0]?.image_url ||
                  'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=200';

                const backendHost = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
                const primaryImg =
                  rawImg.startsWith('http') || rawImg.startsWith('data:')
                    ? rawImg
                    : `${backendHost}${rawImg.startsWith('/') ? '' : '/'}${rawImg}`;

                return (
                  <div
                    key={item.id}
                    className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 transition hover:shadow-md"
                  >
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="w-20 h-20 bg-slate-50 rounded-2xl border border-slate-100 p-2 flex items-center justify-center shrink-0 overflow-hidden">
                        <img
                          src={primaryImg}
                          alt={productName}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="space-y-1">
                        <Link
                          href={productSlug ? `/products/${productSlug}` : '#'}
                          className="font-bold text-slate-900 text-sm hover:text-red-600 transition line-clamp-1"
                        >
                          {productName}
                        </Link>
                        <div className="text-xs text-slate-400">
                          Tình trạng: <span className="font-semibold text-slate-700">{boxCondition}</span>
                        </div>

                        {hasDiscount && (
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <span className="bg-gradient-to-r from-red-600 to-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-sm">
                              <Tag className="w-2.5 h-2.5" /> {discountLabel}
                            </span>
                            {discountCode && (
                              <span className="text-[10px] text-red-600 font-bold bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                                MÃ: {discountCode}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0">
                      <div className="flex items-center bg-slate-50 rounded-2xl border border-slate-200 p-1">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1 || isUpdating}
                          className="p-1.5 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-30 text-slate-700 transition"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-black text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          disabled={isUpdating}
                          className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                     {/* SỬA ĐOẠN NÀY: */}
                      <div className="text-right shrink-0 whitespace-nowrap">
                        <div className="text-base font-black text-red-600 whitespace-nowrap">
                          {(unitPrice * item.quantity).toLocaleString('vi-VN')} đ
                        </div>
                        {hasDiscount && (
                          <div className="text-xs text-slate-400 line-through font-semibold whitespace-nowrap">
                            {(originalPrice * item.quantity).toLocaleString('vi-VN')} đ
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleRemove(item.id)}
                        className="p-2 rounded-xl text-slate-300 hover:text-red-600 hover:bg-red-50 transition"
                        title="Xóa khỏi giỏ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
                <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-4">
                  Tóm Tắt Đơn Hàng
                </h2>

                <div className="space-y-3 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Tổng tiền hàng (Gốc)</span>
                    <span className="font-bold text-slate-800">
                      {totalOriginalPrice.toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  {totalSaved > 0 && (
                    <div className="flex justify-between text-red-600 font-bold bg-red-50 p-2.5 rounded-xl border border-red-100">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Tiết kiệm được:
                      </span>
                      <span>-{totalSaved.toLocaleString('vi-VN')} đ</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Phí vận chuyển</span>
                    <span className="font-bold text-emerald-600">
                      {totalFinalPrice >= 1000000 ? 'Miễn phí' : 'Tính khi thanh toán'}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-400 block uppercase">Tổng Thanh Toán</span>
                    <span className="text-2xl font-black text-red-600">
                      {totalFinalPrice.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="w-full bg-red-600 hover:bg-red-700 active:scale-98 text-white font-black py-4 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
                >
                  Tiến Hành Thanh Toán <ArrowRight className="w-4 h-4" />
                </Link>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium pt-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Bảo mật thông tin & Đổi trả trong 7 ngày</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}