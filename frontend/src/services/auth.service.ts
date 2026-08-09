import { api } from '@/lib/axios';
import {LoginDto,LoginResponse,RegisterDto,RegisterResponse,} from '@/types/auth.type';

export const authService = {
  // 1. Đăng nhập
  login: async (data: LoginDto): Promise<LoginResponse> => {
    const response = await api.post('/api/v1/auth/login', data);
    return response.data;
  },

  // 2. Đăng ký (Gửi kèm địa chỉ giao hàng)
  register: async (data: RegisterDto): Promise<RegisterResponse> => {
    const response = await api.post('/api/v1/auth/register', data);
    return response.data;
  },
};