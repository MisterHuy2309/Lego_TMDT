import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LEGO Store - Thế Giới Lắp Ráp Sáng Tạo',
  description: 'Cửa hàng mô hình Lego chính hãng hàng đầu Việt Nam',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.className} bg-slate-50 text-slate-800 antialiased min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}