'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { 
  Lock, 
  ShieldAlert, 
  RotateCcw, 
  KeyRound, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2,
  Trash2 // 🟢 Import icon Trash2
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [adminPassword, setAdminPassword] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [inputPin, setInputPin] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const [backups, setBackups] = useState<any[]>([]);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const fetchBackups = async () => {
    try {
      const res = await api.get('/admin/settings/revenue-backups');
      setBackups(res.data);
    } catch (err) {
      console.error('Lỗi tải sao lưu:', err);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  // 🟢 HÀM XÓA BẢN SAO LƯU THỦ CÔNG
  const handleDeleteBackup = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa vĩnh viễn bản sao lưu này?')) return;

    try {
      await api.delete(`/admin/settings/revenue-backups/${id}`);
      fetchBackups(); // Reload lại danh sách sau khi xóa thành công
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xóa bản sao lưu!');
    }
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinCode.length !== 6 || !/^\d+$/.test(pinCode)) {
      setMsg({ type: 'error', text: 'Mã PIN phải bao gồm đúng 6 chữ số!' });
      return;
    }

    try {
      setPinLoading(true);
      setMsg({ type: '', text: '' });

      await api.post('/admin/settings/pin', {
        password: adminPassword,
        pin: pinCode,
      });

      setMsg({ type: 'success', text: 'Cài đặt mã PIN bảo mật thành công!' });
      setAdminPassword('');
      setPinCode('');
    } catch (err: any) {
      setMsg({
        type: 'error',
        text: err.response?.data?.message || 'Không thể cài đặt mã PIN!',
      });
    } finally {
      setPinLoading(false);
    }
  };

  const handleExecuteReset = async () => {
    if (inputPin.length !== 6) {
      alert('Vui lòng nhập đủ 6 số PIN!');
      return;
    }

    try {
      setResetLoading(true);
      const res = await api.post('/admin/settings/reset-revenue', {
        pin: inputPin,
      });

      alert(res.data.message);
      setIsPinModalOpen(false);
      setInputPin('');
      window.location.href = '/admin';
    } catch (err: any) {
      alert(err.response?.data?.message || 'Mã PIN không đúng hoặc có lỗi xảy ra!');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
        <Lock className="w-6 h-6 text-red-600" /> Cài Đặt Hệ Thống & Bảo Mật Admin
      </h1>

      {msg.text && (
        <div
          className={`p-4 rounded-xl font-bold flex items-center gap-2 ${
            msg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {msg.type === 'success' ? <CheckCircle2 /> : <AlertTriangle />}
          {msg.text}
        </div>
      )}

      {/* CÀI PIN */}
      <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-blue-600" /> Cài Đặt / Thay Đổi Mã PIN (6 Chữ Số)
        </h2>
        <form onSubmit={handleSavePin} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
              Mật khẩu đăng nhập Admin *
            </label>
            <input
              type="password"
              required
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Nhập mật khẩu tài khoản Admin"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
              Mã PIN mới (6 chữ số) *
            </label>
            <input
              type="password"
              maxLength={6}
              required
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              placeholder="VD: 123456"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono tracking-widest text-slate-800 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={pinLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition flex items-center gap-2"
          >
            {pinLoading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Lưu Mã PIN'}
          </button>
        </form>
      </div>

      {/* RESET DOANH THU */}
      <div className="bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-900/50 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-8 h-8 text-red-600 shrink-0 mt-1" />
          <div>
            <h2 className="text-lg font-bold text-red-800 dark:text-red-400">Reset Doanh Thu Hệ Thống</h2>
            <p className="text-xs text-red-600 dark:text-red-300 mt-1">
              Thao tác này sẽ đặt lại toàn bộ doanh thu hiển thị. Dữ liệu doanh thu cũ sẽ được lưu
              vào **Bản Sao Lưu (Backup)** và tự động xóa vĩnh viễn sau **30 ngày**.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsConfirmOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition flex items-center gap-2"
        >
          <RotateCcw className="w-5 h-5" /> Thực Hiện Reset Doanh Thu
        </button>
      </div>

      {/* 📦 BẢNG SAO LƯU CÓ NÚT XÓA */}
      <div className="bg-white dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Danh Sách Bản Sao Lưu (Lưu trong 30 ngày)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[650px]">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 uppercase text-xs">
              <tr>
                <th className="p-3">Mã Backup</th>
                <th className="p-3">Doanh Thu Reset</th>
                <th className="p-3">Số Đơn</th>
                <th className="p-3">Ngày Thực Hiện</th>
                <th className="p-3">Hạn Tự Xóa</th>
                <th className="p-3 text-center">Xóa Thủ Công</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {backups.map((item) => (
                <tr key={item.id}>
                  <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">{item.backup_code}</td>
                  <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">
                    {Number(item.total_revenue).toLocaleString('vi-VN')} đ
                  </td>
                  <td className="p-3">{item.total_orders} đơn</td>
                  <td className="p-3 text-xs text-slate-500">
                    {new Date(item.created_at).toLocaleString('vi-VN')}
                  </td>
                  <td className="p-3 text-xs font-bold text-red-500">
                    {new Date(item.expires_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleDeleteBackup(item.id)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition"
                      title="Xóa vĩnh viễn bản sao lưu này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {backups.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-400">
                    Chưa có bản sao lưu doanh thu nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: HỎI XÁC NHẬN CÓ / KHÔNG */}
      {isConfirmOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-8 h-8 shrink-0" />
              <h3 className="text-lg font-black dark:text-white">Xác Nhận Reset Doanh Thu?</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Bạn có chắc chắn muốn xóa toàn bộ doanh thu hiện tại không? Dữ liệu sẽ được lưu trong sao lưu 30 ngày.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsConfirmOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm"
              >
                Không
              </button>
              <button
                onClick={() => {
                  setIsConfirmOpen(false);
                  setIsPinModalOpen(true);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm"
              >
                Có, Tiếp Tục
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: NHẬP MÃ PIN */}
      {isPinModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white">Nhập Mã PIN Xác Nhận</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Vui lòng nhập mã PIN 6 số của Admin để hoàn tất Reset doanh thu.
            </p>

            <input
              type="password"
              maxLength={6}
              autoFocus
              value={inputPin}
              onChange={(e) => setInputPin(e.target.value)}
              placeholder="• • • • • •"
              className="w-full text-center text-2xl font-mono tracking-[0.5em] border-2 border-red-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white rounded-2xl p-3 outline-none focus:border-red-500"
            />

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setIsPinModalOpen(false)}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleExecuteReset}
                disabled={resetLoading}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm flex items-center gap-2"
              >
                {resetLoading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Xác Nhận Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}