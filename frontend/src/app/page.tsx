'use client';

import Link from 'next/link';
import { Truck, ShieldCheck, Star, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Banner Khuyến Mãi */}
      <section className="bg-gradient-to-r from-red-600 to-red-700 text-white py-20 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl space-y-5">
            <span className="bg-yellow-400 text-red-900 font-extrabold px-3.5 py-1.5 rounded-full text-xs uppercase tracking-wider shadow">
              HUY GẠCH NHỰA 2026 🧱
            </span>
            <h1 className="text-4xl md:text-6xl font-black leading-tight">
              Khám Phá Thế Giới Sáng Tạo LEGO
            </h1>
            <p className="text-red-100 text-lg leading-relaxed">
              Hàng ngàn bộ lắp ráp chính hãng Star Wars, Technic, Ninjago và Creator đang chờ đón bạn.
            </p>
            <div className="pt-4 flex flex-wrap gap-4">
              <Link
                href="/products"
                className="bg-yellow-400 hover:bg-yellow-300 text-red-900 font-extrabold px-8 py-4 rounded-2xl transition shadow-xl text-lg flex items-center gap-2"
              >
                Khám Phá Sản Phẩm <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Cam kết dịch vụ */}
      <section className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-6 -mt-8 relative z-10">
        <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-red-50 rounded-xl">
            <Truck className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-800">Giao Hàng Toàn Quốc</h3>
            <p className="text-xs text-slate-500 mt-0.5">Miễn phí cho đơn từ 1.000.000đ</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-red-50 rounded-xl">
            <ShieldCheck className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-800">Chính Hãng 100%</h3>
            <p className="text-xs text-slate-500 mt-0.5">Cam kết chất lượng Lego Đan Mạch</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-red-50 rounded-xl">
            <Star className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-800">Đánh Giá Thực Tế</h3>
            <p className="text-xs text-slate-500 mt-0.5">Hàng ngàn bài đánh giá từ cộng đồng</p>
          </div>
        </div>
      </section>
    </div>
  );
}