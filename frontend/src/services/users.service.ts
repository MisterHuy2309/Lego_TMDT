import { api } from '@/lib/axios';

export const usersService = {
  // Lấy danh sách khách hàng kèm trạng thái Online/Offline/Tin nhắn
  getCustomersStatus: async () => {
    const res = await api.get('/users/admin/customers-status');
    return res.data;
  },

  // Gửi tin nhắn trả lời khách
  sendMessage: async (userId: string, message: string) => {
    const res = await api.post(`/users/admin/chat/${userId}`, { message });
    return res.data;
  },

  // Tặng voucher cho khách
  giftVoucher: async (userId: string, discountId: string) => {
    const res = await api.post('/users/admin/gift-voucher', {
      user_id: userId,
      discount_id: discountId,
    });
    return res.data;
  }
};