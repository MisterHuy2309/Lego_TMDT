// DTO Đăng nhập
export interface LoginDto {
  email: string;
  password: string; // Khớp với dto.password ở Backend
}

// DTO Đăng ký (Bao gồm cả Địa chỉ nhận hàng)
export interface RegisterDto {
  full_name: string;
  email: string;
  phone: string;
  password: string;

  // 🟢 Đổi thành optional (?) để khi đăng ký không bắt buộc phải truyền
  street?: string;
  street_address?: string;
  ward?: string;
  district?: string;
  city?: string;
}

// Thông tin User trả về từ API
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'CLIENT';
}

// Response khi Đăng nhập thành công
export interface LoginResponse {
  message: string;
  access_token: string;
  user: User;
}

// Response khi Đăng ký thành công
export interface RegisterResponse {
  message: string;
  userId: string;
}

