'use client';

import { useState, useEffect, ChangeEvent, SubmitEvent } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/axios';
import { 
  User, 
  MapPin, 
  AlertTriangle, 
  Camera, 
  Save, 
  Loader2, 
  CheckCircle2 
} from 'lucide-react';

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    avatar_url: '',
    street: '',
    ward: '',
    district: '',
    city: '',
  });

  // Load thông tin ban đầu khi state user thay đổi
  useEffect(() => {
    if (user) {
      const defaultAddress = Array.isArray(user.addresses) ? user.addresses[0] : null;

      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar_url: user.avatar_url || '',
        street: user.street || user.street_address || defaultAddress?.street || '',
        ward: user.ward || defaultAddress?.ward || '',
        district: user.district || defaultAddress?.district || '',
        city: user.city || defaultAddress?.city || '',
      });
    }
  }, [user]);

  const isAddressMissing =
    !formData.street || !formData.ward || !formData.district || !formData.city;

  // 🟢 1. XỬ LÝ UPLOAD ANH AVATAR
  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 5 * 1024 * 1024) {
      alert('Dung lượng ảnh không được vượt quá 5MB!');
      return;
    }

    const previewUrl = URL.createObjectURL(selectedFile);
    setFormData((prev) => ({ ...prev, avatar_url: previewUrl }));

    const avatarFormData = new FormData();
    avatarFormData.append('file', selectedFile);

    try {
      setUploadingAvatar(true);

      const res = await api.patch('/users/profile/avatar', avatarFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newAvatarUrl = res.data?.avatar_url || res.data?.user?.avatar_url;
      if (newAvatarUrl) {
        setFormData((prev) => ({ ...prev, avatar_url: newAvatarUrl }));
        updateUser({ avatar_url: newAvatarUrl });
        setSuccessMsg('Đã cập nhật ảnh đại diện thành công!');
      }
    } catch (err: any) {
      const backendError = err.response?.data?.message;
      const errorMsg = Array.isArray(backendError)
        ? backendError.join(', ')
        : backendError || err.message || 'Không thể tải ảnh đại diện lên server!';
      
      console.error('Lỗi Upload Avatar:', err.response?.data || err.message);
      alert(`Lỗi Upload Avatar: ${errorMsg}`);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // 🟢 2. XỬ LÝ LƯU THÔNG TIN HỒ SƠ
  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');

    try {
      const payload: Record<string, any> = {
        full_name: formData.full_name,
        phone: formData.phone,
        street: formData.street,
        ward: formData.ward,
        district: formData.district,
        city: formData.city,
      };

      if (
        formData.avatar_url && 
        !formData.avatar_url.startsWith('data:image') && 
        !formData.avatar_url.startsWith('blob:')
      ) {
        payload.avatar_url = formData.avatar_url;
      }

      const res = await api.patch('/users/profile', payload);

      const responseUserData = res.data?.user || res.data;
      const updatedAddress = Array.isArray(responseUserData?.addresses) ? responseUserData.addresses[0] : null;

      // Cập nhật Zustand Store
      updateUser({
        ...responseUserData,
        full_name: formData.full_name,
        phone: formData.phone,
        street: formData.street || updatedAddress?.street,
        ward: formData.ward || updatedAddress?.ward,
        district: formData.district || updatedAddress?.district,
        city: formData.city || updatedAddress?.city,
      });

      setSuccessMsg('Cập nhật thông tin hồ sơ thành công!');
    } catch (err: any) {
      console.error('Lỗi Cập Nhật Profile:', err.response?.data || err.message);
      const backendError = err.response?.data?.message;
      
      const errorText = Array.isArray(backendError)
        ? backendError.join(', ')
        : backendError || 'Không thể cập nhật hồ sơ!';

      alert(`Lỗi: ${errorText}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* CẢNH BÁO CHƯA ĐIỀN ĐỊA CHỈ */}
        {isAddressMissing && (
          <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-4 flex items-center gap-3 text-red-700 shadow-sm animate-bounce">
            <div className="p-2 bg-red-600 text-white rounded-xl shrink-0 font-black">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm md:text-base">Chưa Cập Nhật Địa Chỉ Giao Hàng!</h3>
              <p className="text-xs text-red-600 mt-0.5">
                Vui lòng điền đầy đủ thông tin địa chỉ bên dưới để mua hàng thuận tiện hơn.
              </p>
            </div>
          </div>
        )}

        {/* THÔNG BÁO THÀNH CÔNG */}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-700 rounded-2xl p-4 flex items-center gap-2 text-sm font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            {successMsg}
          </div>
        )}

        {/* FORM HỒ SƠ */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 border-b border-slate-100 pb-6">
            
           {/* AVATAR + UPLOAD */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-red-500 overflow-hidden flex items-center justify-center text-slate-400 font-bold text-2xl shadow-inner">
              {uploadingAvatar ? (
                <Loader2 className="w-8 h-8 animate-spin text-red-600" />
              ) : formData.avatar_url ? (
                <img
                  src={
                    formData.avatar_url.startsWith('http') ||
                    formData.avatar_url.startsWith('data:') ||
                    formData.avatar_url.startsWith('blob:')
                      ? formData.avatar_url
                      : `http://localhost:3000${formData.avatar_url.startsWith('/') ? '' : '/'}${formData.avatar_url}?t=${Date.now()}`
                  }
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Không thể nạp ảnh avatar từ URL:', formData.avatar_url);
                    // Không đè src ngay lập tức nếu đang là URL tạm blob/data
                    if (!formData.avatar_url.startsWith('blob:') && !formData.avatar_url.startsWith('data:')) {
                      (e.target as HTMLImageElement).src =
                        'https://ui-avatars.com/api/?name=' +
                        encodeURIComponent(formData.full_name || 'User');
                    }
                  }}
                />
              ) : (
                <User className="w-12 h-12 text-slate-300" />
              )}
            </div>

            <label className="absolute bottom-0 right-0 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full cursor-pointer shadow-lg transition">
              <Camera className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                disabled={uploadingAvatar}
              />
            </label>
          </div>

            <div className="text-center sm:text-left">
              <h2 className="text-xl font-black text-slate-800">{formData.full_name || 'Khách Hàng LEGO'}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{formData.email}</p>
            </div>
          </div>

          {/* THÔNG TIN CÁ NHÂN */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase flex items-center gap-2">
              <User className="w-4 h-4 text-red-600" /> Thông Tin Cá Nhân
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Họ và Tên *</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Số Điện Thoại *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          {/* ĐỊA CHỈ */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 uppercase flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-600" /> Địa Chỉ Giao Hàng Mặc Định
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Số nhà, Tên đường</label>
              <input
                type="text"
                placeholder="VD: 123 Đường Nguyễn Văn Cừ"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Phường / Xã</label>
                <input
                  type="text"
                  placeholder="Phường Trấn Biên"
                  value={formData.ward}
                  onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Quận / Huyện</label>
                <input
                  type="text"
                  placeholder="TP. Biên Hòa"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Tỉnh / Thành</label>
                <input
                  type="text"
                  placeholder="Đồng Nai"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Lưu Thông Tin Hồ Sơ</>}
          </button>
        </form>
      </div>
    </div>
  );
}