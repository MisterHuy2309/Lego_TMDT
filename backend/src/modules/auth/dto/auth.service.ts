import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './register.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto) {
    // 1. Kiểm tra email đã tồn tại chưa
    const existingUser = await this.prisma.users.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email này đã được sử dụng!');
    }

    // 2. Hash mật khẩu
    const password_hash = await bcrypt.hash(dto.password, 10);

    // 3. Tạo User và Địa chỉ nhận hàng duy nhất trong 1 Transaction
    const newUser = await this.prisma.$transaction(async (tx) => {
      // 3.1 Tạo User
      const user = await tx.users.create({
        data: {
          email: dto.email,
          password_hash,
          full_name: dto.full_name,
          phone: dto.phone,
          role: 'CLIENT',
        },
      });

      // 3.2 Tạo luôn Địa chỉ mặc định cho User đó
      await tx.addresses.create({
        data: {
          user_id: user.id,
          recipient_name: dto.full_name, // Mặc định lấy tên người đăng ký
          phone: dto.phone,              // Mặc định lấy SĐT người đăng ký
          street: dto.street,
          ward: dto.ward,
          district: dto.district,
          city: dto.city,
          is_default: true,
        },
      });

      return user;
    });

    return {
      message: 'Đăng ký tài khoản thành công!',
      userId: newUser.id,
    };
  }
}