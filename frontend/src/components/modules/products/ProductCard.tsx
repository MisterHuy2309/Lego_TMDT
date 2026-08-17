'use client';

import Link from 'next/link';
import { Product } from '@/types/product.type';
import { Star, ShoppingCart, Tag } from 'lucide-react';

interface ProductCardProps {
  product: Product & {
    discount?: {
      id?: string;
      code?: string;
      discount_type?: 'PERCENTAGE' | 'FIXED_AMOUNT';
      discount_value?: number;
      start_date?: string | Date;
      end_date?: string | Date;
      is_active?: boolean;
    } | null;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  // Lấy ảnh đại diện chính (is_primary) hoặc ảnh đầu tiên
  const rawImage =
    product.product_images?.find((img) => img.is_primary)?.image_url ||
    product.product_images?.[0]?.image_url ||
    'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=500';

  // 🟢 HÀM XỬ LÝ NẠP LINK ẢNH (ONLINE / LOCAL / BASE64)
  const getImageUrl = (url: string) => {
    if (!url) return 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=500';
    if (
      url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('data:') ||
      url.startsWith('blob:')
    ) {
      return url;
    }
    const backendHost = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `${backendHost}${cleanPath}`;
  };

  const primaryImage = getImageUrl(rawImage);
  const originalPrice = Number(product.base_price || 0);
  const rating = Number(product.rating_avg || 0).toFixed(1);

  // 🏷️ XỬ LÝ & KIỂM TRA MÃ GIẢM GIÁ
  const discount = product.discount;
  let isDiscountValid = false;
  let finalPrice = originalPrice;
  let discountLabel = '';

  if (discount && discount.is_active !== false) {
    const now = new Date();
    const isStarted = !discount.start_date || new Date(discount.start_date) <= now;
    const isNotExpired = !discount.end_date || new Date(discount.end_date) >= now;

    if (isStarted && isNotExpired) {
      isDiscountValid = true;
      const discountVal = Number(discount.discount_value || 0);

      if (discount.discount_type === 'PERCENTAGE' || !discount.discount_type) {
        finalPrice = Math.max(0, originalPrice - (originalPrice * discountVal) / 100);
        discountLabel = `-${discountVal}%`;
      } else {
        finalPrice = Math.max(0, originalPrice - discountVal);
        discountLabel = discountVal >= 1000 ? `-${(discountVal / 1000).toFixed(0)}K` : `-${discountVal}đ`;
      }
    }
  }

  return (
    <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
      
      {/* 🖼️ CONTAINER ẢNH SẢN PHẨM & BADGES */}
      <div className="relative w-full aspect-square bg-slate-50/80 rounded-2xl p-4 flex items-center justify-center overflow-hidden mb-3">
        
        {/* 🟢 BADGE MÃ BỘ SẢN PHẨM (GÓC TRÁI TRÊN) */}
        {product.item_number && (
          <span className="absolute top-3 left-3 bg-slate-800 text-white text-[11px] font-black px-2.5 py-1 rounded-xl shadow-sm z-10">
            #{product.item_number}
          </span>
        )}

        {/* 🏷️ STICKER GIẢM GIÁ 3D NỔI BẬT (GÓC PHẢI TRÊN) */}
        {isDiscountValid && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 text-white text-[11px] font-black px-2.5 py-1 rounded-xl shadow-md animate-pulse">
            <Tag className="w-3 h-3" />
            <span>{discountLabel}</span>
          </div>
        )}

        {/* ẢNH SẢN PHẨM */}
        <Link href={`/products/${product.slug}`} className="w-full h-full flex items-center justify-center">
          <img
            src={primaryImage}
            alt={product.name}
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300 ease-out"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=500';
            }}
          />
        </Link>
      </div>

      {/* ℹ️ THÔNG TIN SẢN PHẨM */}
      <div className="space-y-2 flex-grow flex flex-col justify-between">
        <div>
          {/* Danh mục & Đánh giá sao */}
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
            <span className="truncate max-w-[65%]">{product.category?.name || 'LEGO Theme'}</span>
            <div className="flex items-center text-amber-500 font-bold gap-1 shrink-0">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{rating}</span>
            </div>
          </div>

          {/* Tên sản phẩm */}
          <Link
            href={`/products/${product.slug}`}
            className="font-bold text-slate-900 text-base line-clamp-1 hover:text-red-600 transition block leading-snug"
          >
            {product.name}
          </Link>
        </div>

        {/* 💵 GIÁ TIỀN & NÚT MUA HÀNG */}
        <div className="pt-2.5 border-t border-slate-50 flex items-end justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Giá từ</span>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-lg font-black text-red-600">
                {finalPrice.toLocaleString('vi-VN')} đ
              </span>
              {isDiscountValid && (
                <span className="text-xs text-slate-400 line-through font-semibold">
                  {originalPrice.toLocaleString('vi-VN')} đ
                </span>
              )}
            </div>
          </div>

          <Link
            href={`/products/${product.slug}`}
            className="w-10 h-10 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-900 font-bold flex items-center justify-center shadow-sm transition shrink-0"
            title="Xem chi tiết & Mua hàng"
          >
            <ShoppingCart className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}