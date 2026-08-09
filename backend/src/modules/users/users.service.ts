import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';

import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Lấy thông tin cá nhân
  async getProfile(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        avatar_url: true,
        role: true,
        created_at: true,
        addresses: {
          take: 1,
        },
      },
    });

    if (!user) throw new NotFoundException('Người dùng không tồn tại');
    return user;
  }

  // 🟢 HÀM LƯU ĐƯỜNG DẪN AVATAR VÀO CSDL
  async uploadAvatar(userId: string, avatarUrl: string) {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    const updatedUser = await this.prisma.users.update({
      where: { id: userId },
      data: { avatar_url: avatarUrl },
    });

    return {
      message: 'Cập nhật ảnh đại diện thành công!',
      avatar_url: avatarUrl,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        full_name: updatedUser.full_name,
        avatar_url: updatedUser.avatar_url,
      },
    };
  }

  // 🟢 CẬP NHẬT PROFILE & TÁCH BẢNG ADDRESSES THÔNG MINH
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.email) {
      const existingEmail = await this.prisma.users.findFirst({
        where: { email: dto.email, NOT: { id: userId } },
      });
      if (existingEmail) {
        throw new ConflictException('Email này đã được đăng ký bởi tài khoản khác');
      }
    }

    // Tách dữ liệu địa chỉ ra khỏi DTO để không làm hỏng query bảng users
    const { street, ward, district, city, ...userProfileData } = dto as any;

    const hasAddressData = street || ward || district || city;
    if (hasAddressData) {
      await this.updateAddress(userId, {
        recipient_name: dto.full_name || 'Khách hàng',
        phone: dto.phone || '',
        street: street || '',
        ward: ward || '',
        district: district || '',
        city: city || '',
      });
    }

    return this.prisma.users.update({
      where: { id: userId },
      data: userProfileData,
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        avatar_url: true,
        role: true,
        addresses: {
          take: 1,
        },
      },
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    const isPasswordValid = await bcrypt.compare(dto.old_password, user.password_hash);
    if (!isPasswordValid) {
      throw new BadRequestException('Mật khẩu cũ không chính xác');
    }

    const newPasswordHash = await bcrypt.hash(dto.new_password, 10);

    await this.prisma.users.update({
      where: { id: userId },
      data: { password_hash: newPasswordHash },
    });

    return { message: 'Đổi mật khẩu thành công' };
  }

  async getMyAddress(userId: string) {
    const address = await this.prisma.addresses.findFirst({
      where: { user_id: userId },
    });

    if (!address) {
      throw new NotFoundException('Chưa có thông tin địa chỉ nhận hàng');
    }

    return address;
  }

  async updateAddress(userId: string, dto: UpdateAddressDto) {
    const existingAddress = await this.prisma.addresses.findFirst({
      where: { user_id: userId },
    });

    if (existingAddress) {
      return this.prisma.addresses.update({
        where: { id: existingAddress.id },
        data: dto,
      });
    }

    return this.prisma.addresses.create({
      data: {
        ...dto,
        user_id: userId,
        is_default: true,
      },
    });
  }

  async findAllCustomers(query: QueryCustomerDto) {
    const { search } = query;

    return this.prisma.users.findMany({
      where: {
        role: 'CLIENT',
        ...(search && {
          OR: [
            { full_name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        created_at: true,
        _count: {
          select: {
            orders: true,
            reviews: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getCustomerAnalytics(userId: string) {
    const customer = await this.prisma.users.findFirst({
      where: { id: userId, role: 'CLIENT' },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        created_at: true,
        addresses: { take: 1 },
      },
    });

    if (!customer) {
      throw new NotFoundException('Không tìm thấy khách hàng!');
    }

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const dayOfWeek = now.getDay();
    const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - distanceToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const allOrders = await this.prisma.orders.findMany({
      where: { user_id: userId },
      select: {
        id: true,
        order_code: true,
        status: true,
        total_amount: true,
        created_at: true,
        order_items: {
          select: {
            quantity: true,
            sku: {
              select: {
                product: {
                  select: {
                    category: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const totalOrdersCount = allOrders.length;
    let ordersThisYearCount = 0;
    let ordersThisMonthCount = 0;
    let ordersThisWeekCount = 0;
    let totalSpent = 0;

    const categoryMap: Record<string, { id: string; name: string; count: number }> = {};

    allOrders.forEach((order) => {
      const orderDate = new Date(order.created_at);

      if (order.status !== 'CANCELLED') {
        totalSpent += Number(order.total_amount);
      }

      if (orderDate >= startOfYear) ordersThisYearCount++;
      if (orderDate >= startOfMonth) ordersThisMonthCount++;
      if (orderDate >= startOfWeek) ordersThisWeekCount++;

      order.order_items.forEach((item) => {
        const category = item.sku.product.category;
        if (category) {
          if (!categoryMap[category.id]) {
            categoryMap[category.id] = {
              id: category.id,
              name: category.name,
              count: 0,
            };
          }
          categoryMap[category.id].count += item.quantity;
        }
      });
    });

    const favoriteCategories = Object.values(categoryMap).sort(
      (a, b) => b.count - a.count,
    );

    return {
      customer,
      analytics: {
        total_orders: totalOrdersCount,
        orders_this_year: ordersThisYearCount,
        orders_this_month: ordersThisMonthCount,
        orders_this_week: ordersThisWeekCount,
        total_spent: totalSpent,
        favorite_categories: favoriteCategories,
      },
      recent_orders: allOrders.slice(0, 5),
    };
  }

  async deleteCustomer(userId: string) {
    const customer = await this.prisma.users.findFirst({
      where: { id: userId, role: 'CLIENT' },
    });

    if (!customer) {
      throw new NotFoundException('Không tìm thấy khách hàng!');
    }

    const activeOrders = await this.prisma.orders.findFirst({
      where: {
        user_id: userId,
        status: { in: ['PENDING', 'PROCESSING', 'SHIPPED'] },
      },
    });

    if (activeOrders) {
      throw new BadRequestException('Không thể xóa khách hàng đang có đơn hàng chưa hoàn thành!');
    }

    return this.prisma.users.delete({
      where: { id: userId },
    });
  }
}