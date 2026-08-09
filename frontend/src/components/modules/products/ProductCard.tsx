import Link from 'next/link';
import { Product } from '@/types/product.type';
import { Star, ShoppingCart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}
export default function ProductCard({ product }: ProductCardProps) {
  // Lấy ảnh đại diện chính (is_primary) hoặc lấy ảnh đầu tiên
  const rawImage =
    product.product_images?.find((img) => img.is_primary)?.image_url ||
    product.product_images?.[0]?.image_url ||
    'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=500';

  // 🟢 HÀM XỬ LÝ NẠP MỌI LOẠI LINK ẢNH (ONLINE / LOCAL / BASE64)
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
    // Gắn host Backend nếu là ảnh tĩnh lưu ở local
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `http://localhost:3000${cleanPath}`;
  };

  const primaryImage = getImageUrl(rawImage);
  const price = Number(product.base_price).toLocaleString('vi-VN');
  const rating = Number(product.rating_avg || 0).toFixed(1);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group">
      {/* Container Ảnh Sản Phẩm */}
      <Link href={`/products/${product.slug}`} className="relative h-56 w-full bg-slate-50 overflow-hidden block">
        {/* 🟢 DÙNG THẺ <img> THƯỜNG ĐỂ BỎ RÀO CẢN DOMAIN CHECK CỦA NEXT.JS */}
        <img
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            // Tự động chuyển về ảnh fallback nếu dán nhầm link chết/xóa
            const target = e.target as HTMLImageElement;
            target.src = 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=500';
          }}
        />
        {product.item_number && (
          <span className="absolute top-3 left-3 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm z-10">
            #{product.item_number}
          </span>
        )}
      </Link>

      {/* Thông tin Sản phẩm */}
      <div className="p-4 flex flex-col flex-grow justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>{product.category?.name || 'Lego Classic'}</span>
            <div className="flex items-center text-amber-500 font-bold gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>{rating}</span>
            </div>
          </div>

          <Link
            href={`/products/${product.slug}`}
            className="font-bold text-slate-800 line-clamp-2 hover:text-red-600 transition min-h-[2.5rem]"
          >
            {product.name}
          </Link>
        </div>

        {/* Giá tiền & Nút Mua */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Giá từ</span>
            <span className="text-lg font-black text-red-600">{price} đ</span>
          </div>

          <Link
            href={`/products/${product.slug}`}
            className="bg-yellow-400 hover:bg-yellow-300 text-red-900 font-bold p-2.5 rounded-xl transition shadow flex items-center justify-center"
          >
            <ShoppingCart className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}