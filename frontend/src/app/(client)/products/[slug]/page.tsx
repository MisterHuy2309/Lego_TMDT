'use client';

import { use, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { productsService } from '@/services/products.service';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Product, ProductSku } from '@/types/product.type';
import { Star, ShoppingCart, Loader2, PackageCheck, Layers } from 'lucide-react';

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();

  const token = useAuthStore((state) => state.token);
  const addItem = useCartStore((state) => state.addItem);

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSku, setSelectedSku] = useState<ProductSku | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchProductDetail();
  }, [slug]);

  const fetchProductDetail = async () => {
    try {
      const data = await productsService.getProductBySlug(slug);
      setProduct(data);
      
      // 🟢 Nếu có danh sách SKU -> Tự động chọn SKU đầu tiên ngay
      if (data && data.product_skus && data.product_skus.length > 0) {
        setSelectedSku(data.product_skus[0]);
      }
    } catch (err) {
      console.error('Lỗi lấy chi tiết sản phẩm:', err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ XỬ LÝ NÚT MUA HÀNG / THÊM VÀO GIỎ
  const handleAddToCart = async () => {
    // 1. Kiểm tra Auth
    const hasToken = token || (typeof window !== 'undefined' && localStorage.getItem('access_token'));
    if (!hasToken) {
      alert('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!');
      router.push('/login');
      return;
    }

    // 2. Lấy SKU hợp lệ từ product_skus
    // Bắt buộc phải có product_skus và lấy id của SKU đó
    const skuToUse = selectedSku || product?.product_skus?.[0];

    if (!skuToUse || !skuToUse.id) {
      alert('Sản phẩm này chưa có SKU/Biến thể trong Database Backend. Vui lòng tạo SKU cho sản phẩm ở Admin trước!');
      return;
    }

    setAdding(true);
    try {
      // Gửi đúng skuToUse.id (ID của SKU trong bảng product_skus)
      await addItem(skuToUse.id, 1);
      alert('Đã thêm sản phẩm vào giỏ hàng thành công!');
    } catch (err: any) {
      console.error('Lỗi thêm giỏ hàng:', err);
      alert(err.response?.data?.message || 'Sản phẩm/Biến thể không tồn tại trong hệ thống!');
    } finally {
      setAdding(false);
    }
  };

  // 🟡 1. Màn hình Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-red-600" />
      </div>
    );
  }

  // 🔴 2. Không tìm thấy sản phẩm
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-semibold">
        Không tìm thấy bộ Lego này.
      </div>
    );
  }

  // 🟢 3. Từ đây TypeScript tự hiểu product chắc chắn KHÔNG null (Hết lỗi ts(18047))
  const primaryImage =
    product.product_images?.find((img) => img.is_primary)?.image_url ||
    product.product_images?.[0]?.image_url ||
    'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=500';

  const displayPrice = selectedSku
    ? Number(selectedSku.price).toLocaleString('vi-VN')
    : Number(product.base_price).toLocaleString('vi-VN');

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-6xl mx-auto bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Ảnh Sản Phẩm */}
        <div className="relative h-96 w-full bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
          <Image src={primaryImage} alt={product.name} fill className="object-contain p-6" priority />
        </div>

        {/* Thông Tin Mua Hàng */}
        <div className="flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
              {product.category?.name || 'LEGO Original'}
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 mt-1 mb-3">
              {product.name}
            </h1>

            {/* Thông số Lego */}
            <div className="flex items-center gap-4 text-xs text-slate-500 mb-6">
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{Number(product.rating_avg || 0).toFixed(1)}</span>
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
                  <span>Tuổi: {product.min_age}+</span>
                </div>
              )}
            </div>

            <div className="text-3xl font-black text-red-600 mb-6">{displayPrice} đ</div>

            {/* Chọn SKU (Tình trạng hộp) */}
            {product.product_skus && product.product_skus.length > 0 && (
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  Tình trạng Hộp (SKU)
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.product_skus.map((sku) => (
                    <button
                      key={sku.id}
                      onClick={() => setSelectedSku(sku)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                        selectedSku?.id === sku.id
                          ? 'border-red-600 bg-red-50 text-red-600'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {sku.box_condition || 'Mới 100%'} ({sku.stock_quantity} sẵn có)
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="text-slate-600 text-sm leading-relaxed mb-6">
              {product.description || 'Chưa có mô tả chi tiết cho sản phẩm này.'}
            </p>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={adding}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-2xl transition shadow-lg flex items-center justify-center gap-2 text-lg disabled:opacity-50"
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
    </div>
  );
}