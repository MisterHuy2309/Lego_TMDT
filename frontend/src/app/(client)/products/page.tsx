'use client';

import { useEffect, useState } from 'react';
import { productsService } from '@/services/products.service';
import { categoriesService, Category } from '@/services/categories.service';
import { Product } from '@/types/product.type';
import ProductCard from '@/components/modules/products/ProductCard';
import { Loader2, Search } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Load danh mục khi vừa mở trang
    categoriesService.getAll().then((data) => setCategories(data));
    fetchProducts();
  }, []);

  const fetchProducts = async (keyword?: string, catId?: string) => {
    setLoading(true);
    try {
      const res = await productsService.getProducts({
        search: keyword !== undefined ? keyword : search,
        category_id: catId !== undefined ? catId : selectedCategory,
        limit: 20,
      });

      if (Array.isArray(res)) {
        setProducts(res);
      } else if (res && Array.isArray(res.data)) {
        setProducts(res.data);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Lỗi lấy danh sách sản phẩm:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(search, selectedCategory);
  };

  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    fetchProducts(search, catId);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Thanh Tìm Kiếm & Tiêu Đề */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-slate-800">Bộ Sưu Tập LEGO</h1>
            <p className="text-sm text-slate-500 mt-1">Khám phá tất cả bộ lắp ráp chính hãng</p>
          </div>

          <form onSubmit={handleSearch} className="relative max-w-md w-full">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm Lego theo tên, mã bộ..."
              className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            />
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-1.5 rounded-lg text-sm transition"
            >
              Tìm kiếm
            </button>
          </form>
        </div>

        {/* 🟢 THANH CHỌN DANH MỤC LỌC DÀNH CHO KHÁCH HÀNG */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          <button
            onClick={() => handleSelectCategory('')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedCategory === ''
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Tất Cả Lego
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleSelectCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Danh Sách Sản Phẩm */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-red-600 mb-2" />
            <span className="text-sm text-slate-500">Đang lọc danh sách Lego...</span>
          </div>
        ) : !Array.isArray(products) || products.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <p className="text-slate-500 text-lg">Không tìm thấy bộ Lego nào thuộc danh mục này.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}