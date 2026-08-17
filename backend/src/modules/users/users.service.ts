import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';

import { ChangePasswordDto } from './dto/change-password.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // 1. PROFILE & TÀI KHOẢN
  // ============================================================================

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
          orderBy: { is_default: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) throw new NotFoundException('Người dùng không tồn tại');
    return user;
  }

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

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.email) {
      const existingEmail = await this.prisma.users.findFirst({
        where: { email: dto.email, NOT: { id: userId } },
      });
      if (existingEmail) {
        throw new ConflictException('Email này đã được đăng ký bởi tài khoản khác');
      }
    }

    const { street, ward, district, city, ...rawUserProfileData } = dto as any;

    const userProfileData: any = {};
    if (rawUserProfileData.full_name !== undefined) userProfileData.full_name = rawUserProfileData.full_name;
    if (rawUserProfileData.email !== undefined) userProfileData.email = rawUserProfileData.email;
    if (rawUserProfileData.phone !== undefined) userProfileData.phone = rawUserProfileData.phone;
    if (rawUserProfileData.avatar_url !== undefined) userProfileData.avatar_url = rawUserProfileData.avatar_url;

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
        created_at: true,
        addresses: {
          orderBy: { is_default: 'desc' },
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

  // ============================================================================
  // 2. ĐỊA CHỈ NHẬN HÀNG
  // ============================================================================

  async getMyAddress(userId: string) {
    const address = await this.prisma.addresses.findFirst({
      where: { user_id: userId },
      orderBy: { is_default: 'desc' },
    });

    if (!address) {
      throw new NotFoundException('Chưa có thông tin địa chỉ nhận hàng');
    }

    return address;
  }

  async updateAddress(userId: string, dto: UpdateAddressDto) {
    const existingAddress = await this.prisma.addresses.findFirst({
      where: { user_id: userId },
      orderBy: { is_default: 'desc' },
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

  // ============================================================================
  // 3. ADMIN - QUẢN LÝ KHÁCH HÀNG & TRẠNG THÁI REALTIME
  // ============================================================================

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

  async getCustomersWithStatus() {
    const customers = await (this.prisma as any).users.findMany({
      where: { role: 'CLIENT' },
      include: {
        addresses: {
          orderBy: { is_default: 'desc' },
          take: 1,
        },
        sent_messages: {
          orderBy: { created_at: 'desc' },
          take: 1,
        },
        user_vouchers: {
          include: { discount: true },
        },
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { last_active_at: 'desc' },
    });

    const now = new Date().getTime();

    return customers.map((user: any) => {
      const lastActive = new Date(user.last_active_at || user.created_at).getTime();
      const diffMinutes = Math.floor((now - lastActive) / (1000 * 60));

      let onlineStatus = 'OFFLINE';
      let offlineDuration = '';

      if (diffMinutes < 5) {
        onlineStatus = 'ONLINE';
      } else if (diffMinutes < 60) {
        offlineDuration = `${diffMinutes} phút trước`;
      } else if (diffMinutes < 1440) {
        offlineDuration = `${Math.floor(diffMinutes / 60)} giờ trước`;
      } else {
        offlineDuration = `${Math.floor(diffMinutes / 1440)} ngày trước`;
      }

      const defaultAddress = user.addresses?.[0];
      const addressString = defaultAddress
        ? `${defaultAddress.street || ''}, ${defaultAddress.ward || ''}, ${defaultAddress.district || ''}, ${defaultAddress.city || ''}`
            .replace(/^,\s*|,\s*$/g, '')
            .trim()
        : 'Chưa cập nhật';

      return {
        id: user.id,
        full_name: user.full_name || 'Khách hàng',
        email: user.email,
        phone: user.phone || 'Chưa cập nhật',
        avatar_url: user.avatar_url,
        address: addressString || 'Chưa cập nhật',
        is_online: onlineStatus === 'ONLINE',
        offline_minutes: diffMinutes,
        offline_duration: offlineDuration,
        last_message: user.sent_messages?.[0]?.message || null,
        last_message_time: user.sent_messages?.[0]?.created_at || null,
        total_orders: user._count?.orders || 0,
        gifted_vouchers: user.user_vouchers || [],
      };
    });
  }

  async giftVoucherToUser(userId: string, discountId: string) {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy khách hàng!');

    const discount = await (this.prisma as any).discounts.findUnique({
      where: { id: discountId },
    });
    if (!discount) throw new NotFoundException('Không tìm thấy mã giảm giá!');

    return (this.prisma as any).user_vouchers.create({
      data: {
        user_id: userId,
        discount_id: discountId,
      },
      include: {
        discount: true,
      },
    });
  }

  // ============================================================================
  // 4. CHAT MESSENGER REALTIME (TEXT, MEDIA, SỬA, XÓA 2 CHIỀU)
  // ============================================================================

  // 💬 4.1 Lấy lịch sử chat
  async getCustomerChatMessages(userId: string) {
    const messages = await (this.prisma as any).chat_messages.findMany({
      where: {
        OR: [{ sender_id: userId }, { receiver_id: userId }],
      },
      orderBy: { created_at: 'asc' },
    });

    return messages.map((m: any) => {
      if (m.deleted_all) {
        return { ...m, message: 'Tin nhắn đã được thu hồi', media_url: null };
      }
      return m;
    });
  }

  // 📤 4.2 Gửi tin nhắn văn bản
  async adminSendMessage(adminId: string, customerId: string, message: string) {
    return (this.prisma as any).chat_messages.create({
      data: {
        sender_id: adminId,
        receiver_id: customerId,
        message,
        is_read: false,
      },
    });
  }

  // 📷 4.3 Gửi tin nhắn kèm Media (Ảnh / Video)
  async adminSendMediaMessage(
    adminId: string,
    customerId: string,
    message?: string,
    mediaUrl?: string,
    mediaType?: string,
  ) {
    return (this.prisma as any).chat_messages.create({
      data: {
        sender_id: adminId,
        receiver_id: customerId,
        message: message || '',
        media_url: mediaUrl,
        media_type: mediaType,
        is_read: false,
      },
    });
  }

  // ✏️ 4.4 Sửa tin nhắn (Fix TS2339)
  async editMessage(messageId: string, newText: string) {
    const msg = await (this.prisma as any).chat_messages.findUnique({
      where: { id: messageId },
    });

    if (!msg) throw new NotFoundException('Không tìm thấy tin nhắn!');

    return (this.prisma as any).chat_messages.update({
      where: { id: messageId },
      data: { message: newText, is_edited: true },
    });
  }

  // 🗑️ 4.5 Xóa tin nhắn (Fix TS2339)
  async deleteMessage(messageId: string, userId: string, deleteType: 'ME' | 'ALL') {
    const msg = await (this.prisma as any).chat_messages.findUnique({
      where: { id: messageId },
    });

    if (!msg) throw new NotFoundException('Không tìm thấy tin nhắn!');

    if (deleteType === 'ALL') {
      return (this.prisma as any).chat_messages.update({
        where: { id: messageId },
        data: {
          deleted_all: true,
          message: 'Tin nhắn đã được thu hồi',
          media_url: null,
        },
      });
    } else {
      const currentDeletedList = msg.deleted_for || [];
      return (this.prisma as any).chat_messages.update({
        where: { id: messageId },
        data: {
          deleted_for: [...currentDeletedList, userId],
        },
      });
    }
  }

  // ============================================================================
  // 5. ANALYTICS & XÓA KHÁCH HÀNG
  // ============================================================================

  async getCustomerAnalytics(userId: string) {
  const customer = await this.prisma.users.findUnique({
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
        orderBy: { is_default: 'desc' },
      },
      sent_messages: {
        orderBy: { created_at: 'desc' },
        take: 5,
      },
      user_vouchers: {
        include: {
          discount: true,
        },
      },
    },
  });

  if (!customer) throw new NotFoundException('Không tìm thấy khách hàng!');

  const allOrders = await this.prisma.orders.findMany({
    where: { user_id: userId },
    select: {
      id: true,
      order_code: true,
      status: true,
      total_amount: true,
      created_at: true,
      order_items: {
        include: {
          sku: {
            include: {
              product: true,
            },
          },
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  const totalSpent = allOrders
    .filter((o) => o.status === 'DELIVERED')
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  const defaultAddress = customer.addresses?.[0];
  const formattedAddress = defaultAddress
    ? [defaultAddress.street, defaultAddress.ward, defaultAddress.district, defaultAddress.city]
        .filter(Boolean)
        .join(', ')
    : 'Chưa cập nhật địa chỉ';

  return {
    customer: {
      ...customer,
      formatted_address: formattedAddress,
    },
    analytics: {
      total_orders: allOrders.length,
      total_spent: totalSpent,
      delivered_orders: allOrders.filter((o) => o.status === 'DELIVERED').length,
    },
    orders: allOrders,
  };
}

  async deleteCustomer(userId: string) {
    const customer = await this.prisma.users.findFirst({
      where: { id: userId, role: 'CLIENT' },
    });

    if (!customer) throw new NotFoundException('Không tìm thấy khách hàng!');

    const activeOrders = await this.prisma.orders.findFirst({
      where: {
        user_id: userId,
        status: { in: ['PENDING', 'CONFIRMED'] },
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