import Link from 'next/link';
import { Package, ShieldCheck, HeartHandshake, MapPin, Phone, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t-8 border-yellow-400 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Cột 1: Thương Hiệu */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="bg-yellow-400 text-red-600 font-black px-3 py-1 rounded text-2xl tracking-wider shadow">
              HUY
            </span>
            <span className="font-bold text-xl text-white tracking-wide">GẠCH NHỰA</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Hệ thống cửa hàng phân phối mô hình lắp ráp LEGO chính hãng hàng đầu Việt Nam. Nơi khơi gợi trí sáng tạo cho mọi lứa tuổi.
          </p>
        </div>

        {/* Cột 2: Liên Kết Nhanh */}
        <div>
          <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
            Khám Phá
          </h3>
          <ul className="space-y-2.5 text-xs">
            <li>
              <Link href="/products" className="hover:text-yellow-400 transition">
                Tất Cả Bộ LEGO
              </Link>
            </li>
            <li>
              <Link href="/products?category=star-wars" className="hover:text-yellow-400 transition">
                LEGO Star Wars
              </Link>
            </li>
            <li>
              <Link href="/products?category=technic" className="hover:text-yellow-400 transition">
                LEGO Technic
              </Link>
            </li>
            <li>
              <Link href="/products?category=ninjago" className="hover:text-yellow-400 transition">
                LEGO Ninjago
              </Link>
            </li>
          </ul>
        </div>

        {/* Cột 3: Hỗ Trợ Khách Hàng */}
        <div>
          <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
            Chính Sách
          </h3>
          <ul className="space-y-2.5 text-xs text-slate-400">
            <li className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-yellow-400" /> Cam kết chính hãng 100%
            </li>
            <li className="flex items-center gap-2">
              <Package className="w-4 h-4 text-yellow-400" /> Đổi trả trong 7 ngày
            </li>
            <li className="flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-yellow-400" /> Bảo hành mảnh ghép thất lạc
            </li>
          </ul>
        </div>

        {/* Cột 4: Liên Hệ */}
        <div>
          <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
            Thông Tin Liên Hệ
          </h3>
          <ul className="space-y-3 text-xs text-slate-400">
            <li className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>Biên Hòa, Đồng Nai, Việt Nam</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-red-500 shrink-0" />
              <span>Hotline: 0901 234 567</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-red-500 shrink-0" />
              <span>Email: support@legostore.vn</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        © 2026 HUY Gạch Nhựa. Powered by Next.js & NestJS Framework.
      </div>
    </footer>
  );
}