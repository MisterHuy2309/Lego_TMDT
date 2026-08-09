import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';

import { RegisterDto } from './dto/create-auth.dto';
import { LoginDto } from './dto/update-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // 1. ĐĂNG KÝ TÀI KHOẢN (ĐỊA CHỈ TÙY CHỌN, KHÔNG BẮT BUỘC)
  async register(dto: RegisterDto) {
    // Kiểm tra email trùng
    const existingUser = await this.prisma.users.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email này đã được sử dụng!');
    }

    // Hash mật khẩu
    const password_hash = await bcrypt.hash(dto.password, 10);

    // Kiểm tra xem người dùng có điền bất kỳ thông tin địa chỉ nào không
    const hasAddressInput = Boolean(
      dto.street || dto.ward || dto.district || dto.city,
    );

    // Dùng Transaction để tạo User và Địa chỉ (nếu có)
    const newUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          email: dto.email,
          password_hash,
          full_name: dto.full_name,
          phone: dto.phone,
          role: 'CLIENT',
        },
      });

      // Chỉ tạo địa chỉ nếu người dùng có nhập thông tin địa chỉ
      if (hasAddressInput) {
        await tx.addresses.create({
          data: {
            user_id: user.id,
            recipient_name: dto.full_name,
            phone: dto.phone,
            street: dto.street || '',
            ward: dto.ward || '',
            district: dto.district || '',
            city: dto.city || '',
            is_default: true,
          },
        });
      }

      return user;
    });

    return {
      message: 'Đăng ký tài khoản thành công!',
      userId: newUser.id,
    };
  }

  // 2. ĐĂNG NHẬP
  async login(dto: LoginDto) {
    // Tìm user theo email kèm địa chỉ mặc định (nếu có)
    const user = await this.prisma.users.findUnique({
      where: { email: dto.email },
      include: {
        addresses: {
          where: { is_default: true },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    // Lấy địa chỉ mặc định
    const defaultAddress = user.addresses[0] || null;

    // Tạo JWT Access Token
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const access_token = await this.jwtService.signAsync(payload);

    return {
      message: 'Đăng nhập thành công',
      access_token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        avatar_url: (user as any).avatar_url || null,
        role: user.role,

        // Trả về thông tin địa chỉ để Frontend check hiển thị cảnh báo đỏ trên Profile
        street_address: defaultAddress?.street || '',
        street: defaultAddress?.street || '',
        ward: defaultAddress?.ward || '',
        district: defaultAddress?.district || '',
        city: defaultAddress?.city || '',
      },
    };
  }
}