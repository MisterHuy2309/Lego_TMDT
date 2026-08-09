'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useAdminStore } from '@/store/useAdminStore';
import { categoriesService, Category } from '@/services/categories.service';
import { productsService, CreateProductDto } from '@/services/products.service';
import { Product } from '@/types/product.type';
import { 
  Package, 
  ShoppingBag, 
  LayoutDashboard, 
  DollarSign, 
  Users, 
  Tag, 
  MessageSquare, 
  Layers, 
  Plus, 
  Trash2, 
  Ban, 
  CheckCircle2, 
  TrendingUp,
  Sun, 
  Moon, 
  Edit2, 
  Loader2, 
  X, 
  Image as ImageIcon, 
  Upload, 
  Link as LinkIcon,
  Menu
} from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // Mobile Sidebar State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Tab & Theme States
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'categories' | 'users' | 'vouchers' | 'comments'>('overview');
  const [darkMode, setDarkMode] = useState(true);

  // Database States
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Zustand Store
  const { 
    users, toggleBlockUser,
    vouchers, addVoucher, deleteVoucher,
    comments, toggleApproveComment, deleteComment
  } = useAdminStore();

  const [newVoucherCode, setNewVoucherCode] = useState('');

  // Modal Category States
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState({ name: '', slug: '', parent_id: '', image_url: '' });

  // Modal Product States
  const [showProdModal, setShowProdModal] = useState(false);
  const [editingProd, setEditingProd] = useState<Product | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [prodForm, setProdForm] = useState<CreateProductDto>({
    name: '',
    slug: '',
    category_id: '',
    description: '',
    item_number: '',
    piece_count: undefined,
    min_age: undefined,
    base_price: 0,
    images: [{ image_url: '', is_primary: true }],
    skus: [{ sku_code: '', box_condition: 'NEW', price: 0, stock_quantity: 10 }],
  });

  const [imageInputType, setImageInputType] = useState<'URL' | 'FILE'>('URL');

  // Sync Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('admin_theme');
    const isDark = savedTheme !== 'light';
    setDarkMode(isDark);

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = !darkMode;
    setDarkMode(nextTheme);
    localStorage.setItem('admin_theme', nextTheme ? 'dark' : 'light');

    if (nextTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Sync Auth
  useEffect(() => {
    const localToken = token || (typeof window !== 'undefined' && localStorage.getItem('access_token'));
    let localUser = user;

    if (!localUser && typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user_info');
      if (storedUser) {
        try { localUser = JSON.parse(storedUser); } catch (e) {}
      }
    }

    if (!localToken) {
      router.replace('/login');
      return;
    }

    if (localUser && localUser.role !== 'ADMIN') {
      router.replace('/');
      return;
    }

    setCheckingAuth(false);
    loadAllData();
  }, [user, token, router]);

  const loadAllData = async () => {
    setLoadingData(true);
    try {
      const [catRes, prodRes] = await Promise.all([
        categoriesService.getAll(),
        productsService.getProducts({ limit: 50 }),
      ]);
      setCategories(catRes);
      setProducts(Array.isArray(prodRes) ? prodRes : prodRes?.data || []);
    } catch (err) {
      console.error('Lỗi tải dữ liệu:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/([^0-9a-z-\s])/g, '')
      .replace(/(\s+)/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Category Actions
  const handleOpenCatModal = (cat?: Category) => {
    if (cat) {
      setEditingCat(cat);
      setCatForm({
        name: cat.name,
        slug: cat.slug,
        parent_id: cat.parent_id || '',
        image_url: cat.image_url || '',
      });
    } else {
      setEditingCat(null);
      setCatForm({ name: '', slug: '', parent_id: '', image_url: '' });
    }
    setShowCatModal(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name.trim()) return alert('Vui lòng nhập tên danh mục!');
    const slug = catForm.slug || generateSlug(catForm.name);

    try {
      if (editingCat) {
        await categoriesService.update(editingCat.id, { ...catForm, slug });
        alert('Cập nhật danh mục thành công!');
      } else {
        await categoriesService.create({ ...catForm, slug });
        alert('Thêm danh mục mới thành công!');
      }
      setShowCatModal(false);
      loadAllData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể lưu danh mục!');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    try {
      await categoriesService.delete(id);
      alert('Đã xóa danh mục!');
      loadAllData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xóa danh mục!');
    }
  };

  // Product Actions
  const handleOpenProdModal = (prod?: Product) => {
    if (prod) {
      setEditingProd(prod);
      const primaryImg = prod.product_images?.find(i => i.is_primary)?.image_url 
        || prod.product_images?.[0]?.image_url || '';
      
      const firstSku = prod.product_skus?.[0];

      setProdForm({
        name: prod.name,
        slug: prod.slug,
        category_id: prod.category_id || '',
        description: prod.description || '',
        item_number: prod.item_number || '',
        piece_count: prod.piece_count || undefined,
        min_age: prod.min_age || undefined,
        base_price: Number(prod.base_price),
        images: [{ image_url: primaryImg, is_primary: true }],
        skus: [{
          sku_code: firstSku?.sku_code || `SKU-${Date.now().toString().slice(-6)}`,
          box_condition: firstSku?.box_condition || 'NEW',
          price: Number(firstSku?.price || prod.base_price),
          stock_quantity: firstSku?.stock_quantity || 10
        }],
      });
    } else {
      setEditingProd(null);
      setProdForm({
        name: '',
        slug: '',
        category_id: categories[0]?.id || '',
        description: '',
        item_number: '',
        piece_count: undefined,
        min_age: undefined,
        base_price: 0,
        images: [{ image_url: '', is_primary: true }],
        skus: [{ sku_code: `SKU-${Date.now().toString().slice(-6)}`, box_condition: 'NEW', price: 0, stock_quantity: 10 }],
      });
    }
    setShowProdModal(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Url = reader.result as string;
        setProdForm((prev) => {
          const newImgs = [...prev.images];
          newImgs[0].image_url = base64Url;
          return { ...prev, images: newImgs };
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.name.trim()) return alert('Vui lòng nhập tên sản phẩm!');
    if (!prodForm.base_price || Number(prodForm.base_price) <= 0) return alert('Giá bán phải lớn hơn 0!');
    
    const slug = prodForm.slug || generateSlug(prodForm.name);
    setSavingProduct(true);

    try {
      const payload: CreateProductDto = {
        ...prodForm,
        slug,
        base_price: Number(prodForm.base_price),
        piece_count: prodForm.piece_count ? Number(prodForm.piece_count) : undefined,
        min_age: prodForm.min_age ? Number(prodForm.min_age) : undefined,
        images: prodForm.images.filter((img) => img.image_url.trim() !== ''),
        skus: prodForm.skus.map((s) => ({
          ...s,
          price: Number(s.price || prodForm.base_price),
          stock_quantity: Number(s.stock_quantity || 0),
        })),
      };

      if (editingProd) {
        await productsService.updateProduct(editingProd.id, payload);
        alert('Đã cập nhật sản phẩm thành công!');
      } else {
        await productsService.createProduct(payload);
        alert('Đã thêm sản phẩm Lego mới thành công!');
      }

      setShowProdModal(false);
      loadAllData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể lưu sản phẩm!');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Xóa sản phẩm này khỏi hệ thống?')) return;
    try {
      await productsService.deleteProduct(id);
      alert('Đã xóa sản phẩm!');
      loadAllData();
    } catch (err: any) {
      alert('Không thể xóa sản phẩm!');
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-300">
        <Loader2 className="w-10 h-10 animate-spin text-red-600 mb-3" />
      </div>
    );
  }

  // Component Nội dung Navigation Sidebar
  const NavigationContent = () => (
    <div className="flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <span className="bg-yellow-400 text-red-600 font-black px-2.5 py-0.5 rounded text-xl tracking-wider shadow">
              HUY
            </span>
            <span className="font-bold text-lg tracking-wide text-slate-800 dark:text-white">ADMIN</span>
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-yellow-400 hover:scale-105 transition shadow-sm border border-slate-200 dark:border-slate-700"
            title={darkMode ? "Chuyển sang Chế độ Sáng" : "Chuyển sang Chế độ Tối"}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <nav className="space-y-1.5 font-semibold text-sm">
          {[
            { id: 'overview', label: 'Bảng Doanh Thu', icon: LayoutDashboard },
            { id: 'products', label: 'Quản Lý Sản Phẩm', icon: Package },
            { id: 'categories', label: 'Quản Lý Danh Mục', icon: Layers },
            { id: 'users', label: 'Quản Lý Khách Hàng', icon: Users },
            { id: 'vouchers', label: 'Quản Lý Mã Giảm Giá', icon: Tag },
            { id: 'comments', label: 'Quản Lý Bình Luận', icon: MessageSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setMobileMenuOpen(false); // Đóng menu mobile khi chọn tab
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  activeTab === tab.id 
                    ? 'bg-red-600 text-white shadow' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 dark:hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" /> {tab.label}
              </button>
            );
          })}

          <Link
            href="/products"
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition mt-6 pt-4 border-t border-slate-200 dark:border-slate-800"
          >
            <ShoppingBag className="w-5 h-5" /> Quay Về Cửa Hàng
          </Link>
        </nav>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-200">
      
      {/* 📱 HEADER CHO MOBILE (< 768px) */}
      <header className="md:hidden bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <span className="bg-yellow-400 text-red-600 font-black px-2 py-0.5 rounded text-lg shadow">
            HUY
          </span>
          <span className="font-bold text-base text-slate-800 dark:text-white">ADMIN</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-yellow-400"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* 📱 DRAWER SLIDE-OVER CHO MOBILE */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="w-72 bg-white dark:bg-slate-950 h-full p-6 shadow-2xl animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <NavigationContent />
          </div>
        </div>
      )}

      {/* 💻 SIDEBAR CHO DESKTOP (>= 768px) */}
      <aside className="hidden md:block w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 p-6 shrink-0 transition-colors">
        <NavigationContent />
      </aside>

      {/* 🖥️ MAIN CONTENT AREA */}
      <main className="flex-grow p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">

          {/* TAB 1: BẢNG DOANH THU */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white">Thống Kê Doanh Thu System</h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                <div className="bg-white dark:bg-slate-800/60 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center gap-4 shadow-sm">
                  <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <DollarSign className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Doanh Thu Tháng</span>
                    <span className="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400">13.400.000 đ</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800/60 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center gap-4 shadow-sm">
                  <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                    <TrendingUp className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Tăng Trưởng Mua Hàng</span>
                    <span className="text-xl md:text-2xl font-black text-blue-600 dark:text-blue-400">+24.5%</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800/60 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center gap-4 shadow-sm sm:col-span-2 md:col-span-1">
                  <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                    <Users className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Khách Hàng Mới</span>
                    <span className="text-xl md:text-2xl font-black text-amber-600 dark:text-amber-400">{users.length} Khách</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: QUẢN LÝ SẢN PHẨM */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white">Quản Lý Sản Phẩm LEGO</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Danh sách bộ Lego trong Cơ Sở Dữ Liệu</p>
                </div>
                <button
                  onClick={() => handleOpenProdModal()}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition w-full sm:w-auto"
                >
                  <Plus className="w-5 h-5" /> Thêm Sản Phẩm Mới
                </button>
              </div>

              {/* Bảng bọc Container overflow-x-auto để Scroll ngang mượt trên Mobile */}
              <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-2 md:p-4 shadow-sm overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[600px]">
                  <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 uppercase text-xs">
                    <tr>
                      <th className="p-3">Sản Phẩm</th>
                      <th className="p-3">Danh Mục</th>
                      <th className="p-3">Giá Cơ Bản</th>
                      <th className="p-3">Mảnh Ghép</th>
                      <th className="p-3 text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                    {products.map((p) => {
                      const thumbImage = p.product_images?.find(i => i.is_primary)?.image_url 
                        || p.product_images?.[0]?.image_url 
                        || 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=100';

                      return (
                        <tr key={p.id}>
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1 shrink-0 overflow-hidden flex items-center justify-center">
                                <img src={thumbImage} alt={p.name} className="w-full h-full object-contain" />
                              </div>
                              <div>
                                <div className="font-bold text-slate-800 dark:text-white line-clamp-1">{p.name}</div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400">Mã: #{p.item_number || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-300">{p.category?.name || 'Chưa chọn'}</td>
                          <td className="p-3 font-bold text-red-600 dark:text-red-400 whitespace-nowrap">{Number(p.base_price).toLocaleString('vi-VN')} đ</td>
                          <td className="p-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">{p.piece_count || 0} mảnh</td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleOpenProdModal(p)}
                                className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                title="Sửa sản phẩm"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                                title="Xóa sản phẩm"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: QUẢN LÝ DANH MỤC */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white">Quản Lý Danh Mục LEGO</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Phân loại dòng sản phẩm</p>
                </div>
                <button
                  onClick={() => handleOpenCatModal()}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition w-full sm:w-auto"
                >
                  <Plus className="w-5 h-5" /> Thêm Danh Mục Mới
                </button>
              </div>

              <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-2 md:p-4 shadow-sm overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[500px]">
                  <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 uppercase text-xs">
                    <tr>
                      <th className="p-3">Tên Danh Mục</th>
                      <th className="p-3">Slug</th>
                      <th className="p-3 text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                    {categories.map((c) => (
                      <tr key={c.id}>
                        <td className="p-3 font-bold text-slate-800 dark:text-white">{c.name}</td>
                        <td className="p-3 text-slate-500 dark:text-slate-400 font-mono text-xs">{c.slug}</td>
                        <td className="p-3 text-center flex justify-center gap-3">
                          <button onClick={() => handleOpenCatModal(c)} className="text-blue-500 hover:underline flex items-center gap-1 font-bold text-xs">
                            <Edit2 className="w-3.5 h-3.5" /> Sửa
                          </button>
                          <button onClick={() => handleDeleteCategory(c.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: QUẢN LÝ KHÁCH HÀNG */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white">Quản Lý Khách Hàng System</h1>
              <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-2 md:p-4 shadow-sm overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[600px]">
                  <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 uppercase text-xs">
                    <tr>
                      <th className="p-3">Họ và Tên</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Quyền</th>
                      <th className="p-3">Trạng Thái</th>
                      <th className="p-3 text-center">Khóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td className="p-3 font-bold">{u.full_name}</td>
                        <td className="p-3 text-slate-500 dark:text-slate-400">{u.email}</td>
                        <td className="p-3"><span className="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-xs">{u.role}</span></td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${u.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button onClick={() => toggleBlockUser(u.id)} className="p-1 hover:scale-110 transition">
                            <Ban className={`w-4 h-4 ${u.status === 'ACTIVE' ? 'text-amber-500' : 'text-emerald-500'}`} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: QUẢN LÝ MÃ GIẢM GIÁ */}
          {activeTab === 'vouchers' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white">Quản Lý Mã Giảm Giá</h1>
                <div className="flex gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Mã Code..."
                    value={newVoucherCode}
                    onChange={(e) => setNewVoucherCode(e.target.value)}
                    className="bg-white dark:bg-slate-800 text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none flex-grow"
                  />
                  <button
                    onClick={() => {
                      if (newVoucherCode) {
                        addVoucher({ code: newVoucherCode.toUpperCase(), discount_percent: 10, max_discount: 50000, status: 'ACTIVE' });
                        setNewVoucherCode('');
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-1 shadow shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Tạo Voucher
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-2 md:p-4 shadow-sm overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[500px]">
                  <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 uppercase text-xs">
                    <tr>
                      <th className="p-3">Mã Voucher</th>
                      <th className="p-3">Mức Giảm</th>
                      <th className="p-3">Trạng Thái</th>
                      <th className="p-3 text-center">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                    {vouchers.map((v) => (
                      <tr key={v.id}>
                        <td className="p-3 font-mono font-bold text-amber-600 dark:text-yellow-400">{v.code}</td>
                        <td className="p-3 font-bold">{v.discount_percent}% (Tối đa {v.max_discount.toLocaleString()}đ)</td>
                        <td className="p-3"><span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded text-xs font-bold">{v.status}</span></td>
                        <td className="p-3 text-center">
                          <button onClick={() => deleteVoucher(v.id)} className="text-red-500 dark:text-red-400 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: QUẢN LÝ BÌNH LUẬN */}
          {activeTab === 'comments' && (
            <div className="space-y-6">
              <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white">Quản Lý Đánh Giá & Bình Luận</h1>
              <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-2 md:p-4 shadow-sm overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[600px]">
                  <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 uppercase text-xs">
                    <tr>
                      <th className="p-3">Khách Hàng</th>
                      <th className="p-3">Sản Phẩm</th>
                      <th className="p-3">Đánh Giá</th>
                      <th className="p-3">Nội Dung</th>
                      <th className="p-3 text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                    {comments.map((cm) => (
                      <tr key={cm.id}>
                        <td className="p-3 font-bold">{cm.user_name}</td>
                        <td className="p-3 text-slate-500 dark:text-slate-400">{cm.product_name}</td>
                        <td className="p-3 font-bold text-amber-500">⭐ {cm.rating}/5</td>
                        <td className="p-3 italic">"{cm.comment}"</td>
                        <td className="p-3 text-center flex justify-center gap-2">
                          <button onClick={() => toggleApproveComment(cm.id)}>
                            <CheckCircle2 className={`w-4 h-4 ${cm.status === 'APPROVED' ? 'text-emerald-500' : 'text-slate-400'}`} />
                          </button>
                          <button onClick={() => deleteComment(cm.id)} className="text-red-500 dark:text-red-400 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* 🔴 MODAL 1: THÊM / SỬA DANH MỤC (RESPONSIVE) */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-5 md:p-6 shadow-2xl space-y-4 md:space-y-5">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg md:text-xl font-black text-slate-800 dark:text-white">
                {editingCat ? 'Cập Nhật Danh Mục' : 'Thêm Danh Mục LEGO Mới'}
              </h2>
              <button onClick={() => setShowCatModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Tên Danh Mục *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: LEGO Star Wars"
                  value={catForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setCatForm({ ...catForm, name, slug: generateSlug(name) });
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">URL Đường Dẫn (Slug) *</label>
                <input
                  type="text"
                  required
                  placeholder="lego-star-wars"
                  value={catForm.slug}
                  onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-mono text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Ảnh Banner / Logo (URL)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={catForm.image_url}
                  onChange={(e) => setCatForm({ ...catForm, image_url: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="w-1/2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl transition text-sm"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition text-sm shadow-lg"
                >
                  Lưu Danh Mục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔴 MODAL 2: THÊM HOẶC SỬA SẢN PHẨM (RESPONSIVE) */}
      {showProdModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl p-5 md:p-8 shadow-2xl space-y-5 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-lg md:text-xl font-black text-slate-800 dark:text-white">
                  {editingProd ? 'Cập Nhật Bộ LEGO' : 'Thêm Bộ LEGO Mới Vẫn Hệ Thống'}
                </h2>
                <p className="text-[11px] md:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {editingProd ? `Đang chỉnh sửa sản phẩm ID: #${editingProd.id}` : 'Điền thông tin bộ sản phẩm, chọn danh mục & ảnh'}
                </p>
              </div>
              <button onClick={() => setShowProdModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Tên Bộ Lego *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Lego Star Wars Millennium Falcon"
                    value={prodForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setProdForm({ ...prodForm, name, slug: generateSlug(name) });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Slug URL *</label>
                  <input
                    type="text"
                    required
                    value={prodForm.slug}
                    onChange={(e) => setProdForm({ ...prodForm, slug: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-mono text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Danh Mục Sản Phẩm *</label>
                  <select
                    value={prodForm.category_id}
                    onChange={(e) => setProdForm({ ...prodForm, category_id: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">-- Chọn Danh Mục --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Giá Bán Niêm Yết (VNĐ) *</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    placeholder="2500000"
                    value={prodForm.base_price || ''}
                    onChange={(e) => setProdForm({ ...prodForm, base_price: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400 font-bold rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 md:gap-3">
                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Mã Bộ</label>
                  <input
                    type="text"
                    placeholder="75313"
                    value={prodForm.item_number || ''}
                    onChange={(e) => setProdForm({ ...prodForm, item_number: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-2.5 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Mảnh Ghép</label>
                  <input
                    type="number"
                    placeholder="7541"
                    value={prodForm.piece_count || ''}
                    onChange={(e) => setProdForm({ ...prodForm, piece_count: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-2.5 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Độ Tuổi</label>
                  <input
                    type="number"
                    placeholder="18"
                    value={prodForm.min_age || ''}
                    onChange={(e) => setProdForm({ ...prodForm, min_age: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-2.5 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Mô Tả Sản Phẩm</label>
                <textarea
                  rows={2}
                  placeholder="Giới thiệu bộ Lego..."
                  value={prodForm.description || ''}
                  onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl p-3 text-xs focus:outline-none leading-relaxed"
                />
              </div>

              {/* HÌNH ẢNH */}
              <div className="bg-slate-100 dark:bg-slate-800/80 p-3 md:p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-red-500" /> Hình Ảnh Sản Phẩm *
                  </label>

                  <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs w-fit">
                    <button
                      type="button"
                      onClick={() => setImageInputType('URL')}
                      className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition ${
                        imageInputType === 'URL' ? 'bg-red-600 text-white' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <LinkIcon className="w-3 h-3" /> Link Online
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputType('FILE')}
                      className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition ${
                        imageInputType === 'FILE' ? 'bg-red-600 text-white' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <Upload className="w-3 h-3" /> Máy Tính
                    </button>
                  </div>
                </div>

                {imageInputType === 'URL' ? (
                  <input
                    type="url"
                    required
                    placeholder="https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=500"
                    value={prodForm.images[0]?.image_url || ''}
                    onChange={(e) => {
                      const url = e.target.value;
                      setProdForm((prev) => {
                        const imgs = [...prev.images];
                        imgs[0] = { image_url: url, is_primary: true };
                        return { ...prev, images: imgs };
                      });
                    }}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-xl cursor-pointer bg-white dark:bg-slate-900">
                      <div className="flex flex-col items-center justify-center pt-2 pb-2">
                        <Upload className="w-5 h-5 text-slate-400 mb-1" />
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Chọn ảnh từ thư viện máy tính</p>
                      </div>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                )}

                {prodForm.images[0]?.image_url && (
                  <div className="flex items-center gap-3 pt-1">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-white p-1 border border-slate-300 dark:border-slate-700 shrink-0">
                      <img src={prodForm.images[0].image_url} alt="Preview" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">✓ Đã nạp ảnh thành công</span>
                  </div>
                )}
              </div>

              {/* SKU / TỒN KHO */}
              <div className="bg-slate-100 dark:bg-slate-800/80 p-3 md:p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Thông Tin SKU & Kho
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase">Mã Kho (SKU)</label>
                    <input
                      type="text"
                      required
                      value={prodForm.skus[0]?.sku_code || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProdForm((prev) => {
                          const skus = [...prev.skus];
                          skus[0].sku_code = val;
                          return { ...prev, skus };
                        });
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase">Tồn Kho</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={prodForm.skus[0]?.stock_quantity || 10}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setProdForm((prev) => {
                          const skus = [...prev.skus];
                          skus[0].stock_quantity = val;
                          return { ...prev, skus };
                        });
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowProdModal(false)}
                  className="w-1/2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl transition text-sm"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="w-1/2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {savingProduct ? <Loader2 className="w-5 h-5 animate-spin" /> : (editingProd ? 'Cập Nhật' : 'Tạo Sản Phẩm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}