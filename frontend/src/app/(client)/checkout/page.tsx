'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { cartService } from '@/types/cart.service'; // ✅ Import từ services
import { CreditCard, Truck, CheckCircle2, Loader2 } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCartStore();

  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'VNPAY'>('COD');
  const [loading, setLoading] = useState(false);

  const totalAmount = items.reduce((sum, item) => {
    const price = Number(item.sku?.price || 0);
    return sum + price * item.quantity;
  }, 0);

  const handleOrder = async () => {
    setLoading(true);
    try {
      const orderRes = await cartService.createOrder({
        address_id: 'default-address-id',
        payment_method: paymentMethod,
      });

      clearCart();

      if (paymentMethod === 'VNPAY') {
        const paymentRes = await cartService.createPaymentUrl(orderRes.id, 'VNPAY');
        window.location.href = paymentRes.payment_url;
        return;
      }

      alert('Đặt hàng thành công!');
      router.push('/profile');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi tạo đơn hàng!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
        <h1 className="text-2xl font-black text-slate-800 mb-6">Thanh Toán Đơn Hàng</h1>

        <div className="space-y-4 mb-8">
          <h2 className="text-sm font-bold text-slate-700 uppercase">Chọn Phương Thức Thanh Toán</h2>

          <div
            onClick={() => setPaymentMethod('COD')}
            className={`p-4 rounded-2xl border-2 cursor-pointer flex items-center justify-between transition ${
              paymentMethod === 'COD' ? 'border-red-600 bg-red-50/50' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <Truck className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="font-bold text-slate-800">Thanh toán khi nhận hàng (COD)</h3>
                <p className="text-xs text-slate-500">Trả tiền mặt trực tiếp cho Shipper khi giao đến</p>
              </div>
            </div>
            {paymentMethod === 'COD' && <CheckCircle2 className="w-6 h-6 text-red-600" />}
          </div>

          <div
            onClick={() => setPaymentMethod('VNPAY')}
            className={`p-4 rounded-2xl border-2 cursor-pointer flex items-center justify-between transition ${
              paymentMethod === 'VNPAY' ? 'border-red-600 bg-red-50/50' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="font-bold text-slate-800">Cổng Thanh Toán VNPay</h3>
                <p className="text-xs text-slate-500">Quét mã QR Code hoặc Thẻ ATM / Mobile Banking</p>
              </div>
            </div>
            {paymentMethod === 'VNPAY' && <CheckCircle2 className="w-6 h-6 text-red-600" />}
          </div>
        </div>

        <div className="border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400 block">Tổng thanh toán</span>
            <span className="text-3xl font-black text-red-600">
              {totalAmount.toLocaleString('vi-VN')} đ
            </span>
          </div>

          <button
            onClick={handleOrder}
            disabled={loading}
            className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3.5 rounded-xl transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Xác Nhận Đặt Hàng'}
          </button>
        </div>
      </div>
    </div>
  );
}