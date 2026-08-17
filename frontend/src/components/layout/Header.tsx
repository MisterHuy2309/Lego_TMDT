'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { ShoppingBag, User, LogOut, ShieldCheck, LayoutDashboard } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Lấy giá trị user, token & logout từ Auth Store
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);

  // Lấy giỏ hàng từ Cart Store
  const items = useCartStore((state) => state.items);
  const fetchCart = useCartStore((state) => state.fetchCart);

  // Tránh lỗi Hydration giữa SSR và CSR
  useEffect(() => {
    setMounted(true);
  }, []);

  // Chỉ tự động tải giỏ hàng khi có người dùng và token hợp lệ
  useEffect(() => {
    const hasToken = token || (typeof window !== 'undefined' && localStorage.getItem('access_token'));
    if (user && hasToken) {
      fetchCart();
    }
  }, [user, token, fetchCart]);

  // Tính tổng số lượng mặt hàng trong giỏ hàng
  const totalCartCount = Array.isArray(items)
    ? items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)
    : 0;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="bg-red-600 text-white shadow-md sticky top-0 z-50">
      {/* Top Banner Thông Báo */}
      <div className="bg-red-700 text-slate-100 text-[11px] py-1 px-4 text-center font-medium flex items-center justify-center gap-2 border-b border-red-800">
        <ShieldCheck className="w-3.5 h-3.5 text-yellow-400" />
        <span>Cam kết 100% LEGO Đan Mạch Chính Hãng — Miễn phí vận chuyển cho đơn từ 1.000.000đ</span>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 py-3.5 flex justify-between items-center gap-4">
        {/* Logo Lego Store */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="bg-yellow-400 text-red-600 font-black px-3 py-1 rounded-lg text-2xl tracking-wider shadow group-hover:scale-105 transition-transform duration-200">
            HUY
          </span>
          <span className="font-bold text-xl tracking-wide hidden sm:inline">GẠCH NHỰA</span>
        </Link>

        {/* Menu Điều Hướng Trang Chủ / Sản Phẩm / Đơn Hàng */}
        <nav className="hidden md:flex items-center gap-8 font-bold text-sm">
          <Link href="/" className="hover:text-yellow-300 transition">
            Trang Chủ
          </Link>
          <Link href="/products" className="hover:text-yellow-300 transition">
            Sản Phẩm
          </Link>
          {/* 🟢 ĐÃ CẬP NHẬT: Trỏ chính xác đến trang /orders thay vì /profile */}
          <Link href="/orders" className="hover:text-yellow-300 transition">
            Đơn Hàng Của Tôi
          </Link>
        </nav>

        {/* Khu Vực Nút Chức Năng (Admin, Giỏ Hàng & Tài Khoản) */}
        <div className="flex items-center gap-3">
          
          {/* Nút Dashboard Admin */}
          {mounted && user && user.role === 'ADMIN' && (
            <Link
              href="/admin"
              className="bg-yellow-400 hover:bg-yellow-300 text-red-900 font-extrabold text-xs px-3 py-2 rounded-xl transition-all shadow flex items-center gap-1.5 active:scale-95"
              title="Trang Quản Trị Admin"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Trang Admin</span>
            </Link>
          )}

          {/* Nút Giỏ Hàng */}
          <Link
            href="/cart"
            className="relative p-2.5 bg-red-700 hover:bg-red-800 rounded-xl transition flex items-center justify-center shadow"
          >
            <ShoppingBag className="w-5 h-5 text-white" />
            {mounted && totalCartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-red-900 font-black text-xs w-5 h-5 rounded-full flex items-center justify-center border-2 border-red-600 shadow">
                {totalCartCount}
              </span>
            )}
          </Link>

          {/* Trạng Thái Đăng Nhập / Tài Khoản */}
          {mounted && (
            <>
              {user ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 bg-red-700 hover:bg-red-800 px-3 py-2 rounded-xl transition border border-red-500"
                    title="Thông tin cá nhân"
                  >
                    <User className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs font-bold max-w-[100px] truncate">
                      {user.full_name}
                    </span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    title="Đăng xuất"
                    className="p-2 bg-red-800 hover:bg-red-900 rounded-xl transition text-slate-200 hover:text-white"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="bg-yellow-400 hover:bg-yellow-300 text-red-900 font-extrabold text-xs px-4 py-2.5 rounded-xl transition shadow flex items-center gap-1.5"
                >
                  <User className="w-4 h-4" /> Đăng Nhập
                </Link>
              )}
            </>
          )}

        </div>
      </div>
    </header>
  );
}