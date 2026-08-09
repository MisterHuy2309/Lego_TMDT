'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useAdminStore } from '@/store/useAdminStore';
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
  ShieldAlert,
  Loader2
} from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Đọc token từ Zustand hoặc localStorage
    const localToken = token || (typeof window !== 'undefined' && localStorage.getItem('access_token'));
    let localUser = user;

    if (!localUser && typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user_info');
      if (storedUser) {
        try {
          localUser = JSON.parse(storedUser);
        } catch (e) {
          console.error(e);
        }
      }
    }

    // 1. Chưa đăng nhập -> Chuyển về trang login
    if (!localToken) {
      router.replace('/login');
      return;
    }

    // 2. Tắt màn hình Loading ngay
    setCurrentUser(localUser);
    setCheckingAuth(false);
  }, [user, token, router]);

  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'categories' | 'users' | 'vouchers' | 'comments'>('overview');
  const [darkMode, setDarkMode] = useState(true);

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

  const { 
    categories, addCategory, deleteCategory,
    products, addProduct, deleteProduct,
    users, toggleBlockUser,
    vouchers, addVoucher, deleteVoucher,
    comments, toggleApproveComment, deleteComment
  } = useAdminStore();

  const [newCatName, setNewCatName] = useState('');
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newVoucherCode, setNewVoucherCode] = useState('');

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-slate-300">
        <Loader2 className="w-10 h-10 animate-spin text-red-600 mb-3" />
        <p className="text-sm font-semibold">Đang tải Admin Dashboard...</p>
      </div>
    );
  }

  // Nếu là tài khoản Khách hàng (role != ADMIN) -> Báo Từ chối truy cập
  if (currentUser && currentUser.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md border-t-8 border-red-600">
          <ShieldAlert className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-slate-800 mb-2">Truy Cập Bị Từ Chối</h1>
          <p className="text-sm text-slate-500 mb-6">
            Tài khoản <span className="font-bold text-slate-700">({currentUser.email})</span> không có quyền Quản trị viên (ADMIN).
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition shadow"
          >
            Quay Về Trang Chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex transition-colors duration-200">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shrink-0 transition-colors">
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
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                activeTab === 'overview' 
                  ? 'bg-red-600 text-white shadow' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" /> Bảng Doanh Thu
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                activeTab === 'products' 
                  ? 'bg-red-600 text-white shadow' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 dark:hover:text-white'
              }`}
            >
              <Package className="w-5 h-5" /> Quản Lý Sản Phẩm
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                activeTab === 'categories' 
                  ? 'bg-red-600 text-white shadow' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 dark:hover:text-white'
              }`}
            >
              <Layers className="w-5 h-5" /> Quản Lý Danh Mục
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                activeTab === 'users' 
                  ? 'bg-red-600 text-white shadow' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 dark:hover:text-white'
              }`}
            >
              <Users className="w-5 h-5" /> Quản Lý Khách Hàng
            </button>

            <button
              onClick={() => setActiveTab('vouchers')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                activeTab === 'vouchers' 
                  ? 'bg-red-600 text-white shadow' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 dark:hover:text-white'
              }`}
            >
              <Tag className="w-5 h-5" /> Quản Lý Mã Giảm Giá
            </button>

            <button
              onClick={() => setActiveTab('comments')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                activeTab === 'comments' 
                  ? 'bg-red-600 text-white shadow' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 dark:hover:text-white'
              }`}
            >
              <MessageSquare className="w-5 h-5" /> Quản Lý Bình Luận
            </button>

            <Link
              href="/products"
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition mt-6 pt-4 border-t border-slate-200 dark:border-slate-800"
            >
              <ShoppingBag className="w-5 h-5" /> Quay Về Cửa Hàng
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* TAB 1: BẢNG DOANH THU & TỔNG QUAN */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-black text-slate-800 dark:text-white">Thống Kê Doanh Thu System</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center gap-4 shadow-sm">
                  <div className="p-3.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <DollarSign className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Tổng Doanh Thu Tháng</span>
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">13.400.000 đ</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center gap-4 shadow-sm">
                  <div className="p-3.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                    <TrendingUp className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Tăng Trưởng Mua Hàng</span>
                    <span className="text-2xl font-black text-blue-600 dark:text-blue-400">+24.5%</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center gap-4 shadow-sm">
                  <div className="p-3.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                    <Users className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Khách Hàng Mới</span>
                    <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{users.length} Khách</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: QUẢN LÝ SẢN PHẨM */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-black text-slate-800 dark:text-white">Quản Lý Sản Phẩm LEGO</h1>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Tên sản phẩm..."
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    className="bg-white dark:bg-slate-800 text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Giá..."
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="bg-white dark:bg-slate-800 text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 w-28 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      if (newProdName && newProdPrice) {
                        addProduct({
                          name: newProdName,
                          slug: newProdName.toLowerCase().replace(/\s+/g, '-'),
                          price: Number(newProdPrice),
                          category: 'LEGO Classic',
                          stock: 10,
                        });
                        setNewProdName('');
                        setNewProdPrice('');
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-1 shadow"
                  >
                    <Plus className="w-4 h-4" /> Thêm LEGO
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-4 shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 uppercase text-xs">
                    <tr>
                      <th className="p-3">Sản Phẩm</th>
                      <th className="p-3">Danh Mục</th>
                      <th className="p-3">Giá Bán</th>
                      <th className="p-3">Kho</th>
                      <th className="p-3 text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                    {products.map((p) => (
                      <tr key={p.id}>
                        <td className="p-3 font-bold">{p.name}</td>
                        <td className="p-3 text-slate-500 dark:text-slate-400">{p.category}</td>
                        <td className="p-3 font-bold text-red-600 dark:text-red-400">{p.price.toLocaleString('vi-VN')} đ</td>
                        <td className="p-3">{p.stock} bộ</td>
                        <td className="p-3 text-center">
                          <button onClick={() => deleteProduct(p.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1">
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

          {/* TAB 3: QUẢN LÝ DANH MỤC */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-black text-slate-800 dark:text-white">Quản Lý Danh Mục LEGO</h1>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Tên danh mục..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="bg-white dark:bg-slate-800 text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      if (newCatName) {
                        addCategory({ name: newCatName, slug: newCatName.toLowerCase().replace(/\s+/g, '-') });
                        setNewCatName('');
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-1 shadow"
                  >
                    <Plus className="w-4 h-4" /> Thêm Danh Mục
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-4 shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 uppercase text-xs">
                    <tr>
                      <th className="p-3">Tên Danh Mục</th>
                      <th className="p-3">Slug</th>
                      <th className="p-3 text-center">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                    {categories.map((c) => (
                      <tr key={c.id}>
                        <td className="p-3 font-bold">{c.name}</td>
                        <td className="p-3 text-slate-500 dark:text-slate-400">{c.slug}</td>
                        <td className="p-3 text-center">
                          <button onClick={() => deleteCategory(c.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 p-1">
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
              <h1 className="text-2xl font-black text-slate-800 dark:text-white">Quản Lý Khách Hàng System</h1>
              <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-4 shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 uppercase text-xs">
                    <tr>
                      <th className="p-3">Họ và Tên</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Quyền</th>
                      <th className="p-3">Trạng Thái</th>
                      <th className="p-3 text-center">Thao Tác Khóa</th>
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

          {/* TAB 5: QUẢN LÝ MÃ GIẢM GIÁ VOUCHER */}
          {activeTab === 'vouchers' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-black text-slate-800 dark:text-white">Quản Lý Mã Giảm Giá (Vouchers)</h1>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Mã Code (VD: LEGO10)..."
                    value={newVoucherCode}
                    onChange={(e) => setNewVoucherCode(e.target.value)}
                    className="bg-white dark:bg-slate-800 text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      if (newVoucherCode) {
                        addVoucher({ code: newVoucherCode.toUpperCase(), discount_percent: 10, max_discount: 50000, status: 'ACTIVE' });
                        setNewVoucherCode('');
                      }
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-1 shadow"
                  >
                    <Plus className="w-4 h-4" /> Tạo Voucher
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-4 shadow-sm">
                <table className="w-full text-left text-sm">
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

          {/* TAB 6: QUẢN LÝ BÌNH LUẬN & ĐÁNH GIÁ */}
          {activeTab === 'comments' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-black text-slate-800 dark:text-white">Quản Lý Đánh Giá & Bình Luận</h1>
              <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 p-4 shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 uppercase text-xs">
                    <tr>
                      <th className="p-3">Khách Hàng</th>
                      <th className="p-3">Sản Phẩm</th>
                      <th className="p-3">Đánh Giá</th>
                      <th className="p-3">Nội Dung</th>
                      <th className="p-3 text-center">Duyệt/Xóa</th>
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
                          <button onClick={() => toggleApproveComment(cm.id)} title="Duyệt bài">
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
    </div>
  );
}