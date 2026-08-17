'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { productsService } from '@/services/products.service';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Product, ProductSku } from '@/types/product.type';
import { Star, ShoppingCart, Loader2, PackageCheck, Layers, Tag, Sparkles } from 'lucide-react';
import ProductReviews from '@/components/modules/products/ProductReviews';

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();

  const token = useAuthStore((state) => state.token);
  const addItem = useCartStore((state) => state.addItem);

  const [product, setProduct] = useState<any | null>(null);
  const [selectedSku, setSelectedSku] = useState<ProductSku | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // 🟢 TỰ ĐỘNG GỠ BỎ CLASS DARK KHỎI GIAO DIỆN CLIENT
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    fetchProductDetail();
  }, [slug]);

  const fetchProductDetail = async () => {
    try {
      const data = await productsService.getProductBySlug(slug);
      setProduct(data);

      if (data && data.product_skus && data.product_skus.length > 0) {
        setSelectedSku(data.product_skus[0]);
      }
    } catch (err) {
      console.error('Lỗi lấy chi tiết sản phẩm:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    const hasToken = token || (typeof window !== 'undefined' && localStorage.getItem('access_token'));
    if (!hasToken) {
      alert('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!');
      router.push('/login');
      return;
    }

    const skuToUse = selectedSku || product?.product_skus?.[0];

    if (!skuToUse || !skuToUse.id) {
      alert('Sản phẩm này chưa có SKU/Biến thể trong Database Backend.');
      return;
    }

    setAdding(true);
    try {
      await addItem(skuToUse.id, 1);
      alert('Đã thêm sản phẩm vào giỏ hàng thành công!');
    } catch (err: any) {
      console.error('Lỗi thêm giỏ hàng:', err);
      alert(err.response?.data?.message || 'Sản phẩm/Biến thể không tồn tại trong hệ thống!');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-red-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-semibold">
        Không tìm thấy bộ Lego này.
      </div>
    );
  }

  // 🟢 HÀM XỬ LÝ ẢNH
  const rawImg =
    product.product_images?.find((img: any) => img.is_primary)?.image_url ||
    product.product_images?.[0]?.image_url ||
    'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=500';

  const backendHost = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
  const primaryImage =
    rawImg.startsWith('http') || rawImg.startsWith('data:')
      ? rawImg
      : `${backendHost}${rawImg.startsWith('/') ? '' : '/'}${rawImg}`;

  // 🏷️ XỬ LÝ MÃ GIẢM GIÁ
  const rawPrice = selectedSku ? Number(selectedSku.price) : Number(product.base_price || 0);
  const discount = product.discount;

  let isDiscountValid = false;
  let finalPrice = rawPrice;
  let savedAmount = 0;
  let discountBadgeLabel = '';

  if (discount && discount.is_active !== false) {
    const now = new Date();
    const isStarted = !discount.start_date || new Date(discount.start_date) <= now;
    const isNotExpired = !discount.end_date || new Date(discount.end_date) >= now;

    if (isStarted && isNotExpired) {
      isDiscountValid = true;
      const discountVal = Number(discount.discount_value || 0);

      if (discount.discount_type === 'PERCENTAGE') {
        savedAmount = (rawPrice * discountVal) / 100;
        finalPrice = Math.max(0, rawPrice - savedAmount);
        discountBadgeLabel = `GIẢM ${discountVal}%`;
      } else {
        savedAmount = Math.min(rawPrice, discountVal);
        finalPrice = Math.max(0, rawPrice - discountVal);
        discountBadgeLabel =
          discountVal >= 1000 ? `GIẢM ${(discountVal / 1000).toFixed(0)}K` : `GIẢM ${discountVal.toLocaleString('vi-VN')}đ`;
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Khối Chi Tiết Sản Phẩm */}
        <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* Ảnh Sản Phẩm & Sticker Giảm Giá */}
          <div className="relative h-96 md:h-[440px] w-full bg-slate-50/80 rounded-3xl overflow-hidden border border-slate-100 flex items-center justify-center p-6 group">
            {/* Mã bộ Lego */}
            {product.item_number && (
              <span className="absolute top-4 left-4 bg-slate-900 text-white text-xs font-black px-3 py-1 rounded-xl shadow-sm z-10">
                #{product.item_number}
              </span>
            )}

            {/* 🏷️ STICKER GIẢM GIÁ GÓC PHẢI */}
            {isDiscountValid && (
              <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-1 animate-pulse">
                <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 text-white font-black text-xs md:text-sm px-3.5 py-1.5 rounded-2xl shadow-lg shadow-red-500/20 flex items-center gap-1.5">
                  <Tag className="w-4 h-4" />
                  <span>{discountBadgeLabel}</span>
                </div>
                <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-md border border-red-200">
                  MÃ: {discount.code}
                </span>
              </div>
            )}

            <img
              src={primaryImage}
              alt={product.name}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=500';
              }}
            />
          </div>

          {/* Thông Tin Mua Hàng */}
          <div className="flex flex-col justify-between space-y-6">
            <div>
              <span className="text-xs font-bold text-red-600 uppercase tracking-wider block">
                {product.category?.name || 'LEGO Original'}
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-1 mb-3">
                {product.name}
              </h1>

              {/* Thông số Lego */}
              <div className="flex items-center gap-4 text-xs text-slate-500 mb-5 flex-wrap">
                <div className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span>{Number(product.rating_avg || 5.0).toFixed(1)}</span>
                </div>
                {product.piece_count && (
                  <div className="flex items-center gap-1">
                    <Layers className="w-4 h-4" />
                    <span>{product.piece_count} Mảnh ghép</span>
                  </div>
                )}
                {product.min_age && (
                  <div className="flex items-center gap-1">
                    <PackageCheck className="w-4 h-4" />
                    <span>Độ tuổi: {product.min_age}+</span>
                  </div>
                )}
              </div>

              {/* 💵 KHỐI GIÁ TIỀN & BANNER TIẾT KIỆM */}
              <div className="bg-slate-50 p-4 md:p-5 rounded-2xl border border-slate-100 mb-6 space-y-3">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl md:text-4xl font-black text-red-600">
                    {finalPrice.toLocaleString('vi-VN')} đ
                  </span>
                  {isDiscountValid && (
                    <span className="text-sm md:text-base text-slate-400 line-through font-semibold">
                      {rawPrice.toLocaleString('vi-VN')} đ
                    </span>
                  )}
                </div>

                {isDiscountValid && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-xl flex items-center justify-between text-xs text-red-700">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-red-600 shrink-0" />
                      <span>
                        Áp dụng mã <strong>{discount.code}</strong>. Tiết kiệm ngay{' '}
                        <strong>{savedAmount.toLocaleString('vi-VN')}đ</strong>!
                      </span>
                    </div>
                    <span className="font-black text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-md shadow-sm">
                      HOT SALE
                    </span>
                  </div>
                )}
              </div>

              {/* Chọn SKU (Tình trạng hộp) */}
              {product.product_skus && product.product_skus.length > 0 && (
                <div className="mb-6">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                    Tình trạng Hộp (SKU)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.product_skus.map((sku: any) => (
                      <button
                        key={sku.id}
                        type="button"
                        onClick={() => setSelectedSku(sku)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition ${
                          selectedSku?.id === sku.id
                            ? 'border-red-600 bg-red-50 text-red-600 shadow-sm'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {sku.box_condition || 'Mới 100%'} ({sku.stock_quantity} sẵn có)
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mô tả */}
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                {product.description || 'Chưa có mô tả chi tiết cho sản phẩm này.'}
              </p>
            </div>

            {/* Nút Thêm Giỏ Hàng */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={adding}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl transition shadow-lg flex items-center justify-center gap-2 text-lg disabled:opacity-50 active:scale-98"
            >
              {adding ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <ShoppingCart className="w-6 h-6" /> Thêm Vào Giỏ Hàng
                </>
              )}
            </button>
          </div>
        </div>

        {/* Khối Đánh Giá & Bình Luận */}
        <ProductReviews productId={product.id} />
      </div>
    </div>
  );
}