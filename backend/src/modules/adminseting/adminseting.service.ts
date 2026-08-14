import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResetRevenueDto, SetPinDto } from './dto/admin-settings.dto';

@Injectable()
export class AdminSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  // 🔐 1. CÀI ĐẶT HOẶC CẬP NHẬT MÃ PIN (Yêu cầu Mật khẩu Admin)
  async setupAdminPin(userId: string, dto: SetPinDto) {
    const admin = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!admin || admin.role !== 'ADMIN') {
      throw new ForbiddenException('Chỉ tài khoản Admin mới có quyền thao tác!');
    }

    // Xác thực lại Mật khẩu Admin
    const isPasswordValid = await bcrypt.compare(dto.password, admin.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Mật khẩu đăng nhập Admin không chính xác!');
    }

    // Mã hóa mã PIN 6 số trước khi lưu
    const hashedPin = await bcrypt.hash(dto.pin, 10);

    await this.prisma.users.update({
      where: { id: userId },
      data: { admin_pin: hashedPin },
    });

    return { message: 'Cài đặt mã PIN bảo mật thành công!' };
  }

  // backend/src/modules/adminseting/adminseting.service.ts

  // 🔄 2. RESET DOANH THU & TOÀN BỘ ĐƠN HÀNG (SAO LƯU 30 NGÀY)
  async resetRevenue(userId: string, dto: ResetRevenueDto) {
    const admin = await (this.prisma as any).users.findUnique({
      where: { id: userId },
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này!');
    }

    if (!admin.admin_pin) {
      throw new BadRequestException('Bạn chưa cài đặt mã PIN bảo mật. Vui lòng cài đặt PIN trước!');
    }

    // Xác thực mã PIN
    const isPinValid = await bcrypt.compare(dto.pin, admin.admin_pin);
    if (!isPinValid) {
      throw new UnauthorizedException('Mã PIN xác nhận không chính xác!');
    }

    // 🟢 Lấy TẤT CẢ các đơn hàng hiện có (Chưa bị ARCHIVED)
    const allOrders = await (this.prisma as any).orders.findMany({
      where: {
        status: { not: 'ARCHIVED' },
      },
    });

    if (!allOrders || allOrders.length === 0) {
      throw new BadRequestException('Hiện không có dữ liệu đơn hàng nào để Reset!');
    }

    // Tính tổng doanh thu thực tế từ các đơn DELIVERED
    const totalRevenue = allOrders
      .filter((o: any) => o.status === 'DELIVERED')
      .reduce((sum: number, order: any) => sum + Number(order.total_amount || 0), 0);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // Hạn 30 ngày
    const backupCode = `REV-BACKUP-${Date.now().toString().slice(-6)}`;

    // Transaction: Lưu snapshot toàn bộ đơn hàng -> Đổi trạng thái sang ARCHIVED
    return this.prisma.$transaction(async (tx: any) => {
      // 1. Tạo bản sao lưu Backup chứa toàn bộ danh sách đơn
      const backup = await tx.revenue_backups.create({
        data: {
          backup_code: backupCode,
          total_revenue: totalRevenue,
          total_orders: allOrders.length,
          backup_data: allOrders, // Snapshot toàn bộ đơn hàng
          created_by: userId,
          created_at: now,
          expires_at: expiresAt,
        },
      });

      // 🟢 2. ĐƯA TẤT CẢ ĐƠN HÀNG SANG 'ARCHIVED' ĐỂ XÓA TRẮNG BẢNG
      await tx.orders.updateMany({
        where: {
          status: { not: 'ARCHIVED' },
        },
        data: { status: 'ARCHIVED' },
      });

      return {
        message: 'Reset toàn bộ đơn hàng & doanh thu thành công! Đã sao lưu trong 30 ngày.',
        backup_code: backup.backup_code,
        total_reset_amount: totalRevenue,
        expires_at: expiresAt,
      };
    });
  }

  // 🗑️ 3. TỰ ĐỘNG XÓA BACKUP HẾT HẠN (30 NGÀY) - Dùng CronJob hoặc gọi tự động
  async autoPurgeExpiredBackups() {
    const now = new Date();
    const result = await this.prisma.revenue_backups.deleteMany({
      where: {
        expires_at: {
          lte: now,
        },
      },
    });
    return { purged_count: result.count };
  }

  // 📦 4. LẤY DANH SÁCH BẢN BACKUP DOANH THU
  async getRevenueBackups() {
    return this.prisma.revenue_backups.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        admin: {
          select: { full_name: true, email: true },
        },
      },
    });
  }


  async deleteBackup(id: string) {
    const backup = await (this.prisma as any).revenue_backups.findUnique({
      where: { id },
    });

    if (!backup) {
      throw new NotFoundException('Bản sao lưu không tồn tại hoặc đã bị xóa!');
    }

    return (this.prisma as any).revenue_backups.delete({
      where: { id },
    });
  }
}