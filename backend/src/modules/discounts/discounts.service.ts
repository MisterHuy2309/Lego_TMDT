import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

import {
  ApplyDiscountDto,
  CreateDiscountDto,
} from './dto/create-discounts.dto';
import { UpdateDiscountsDto } from './dto/update-discounts.dto';

@Injectable()
export class DiscountsService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. TẠO MÃ VOUCHER VỚI NGÀY GIỜ BẮT ĐẦU & KẾT THÚC
  async create(dto: CreateDiscountDto) {
    const formattedCode = dto.code.trim().toUpperCase();

    const existingCode = await this.prisma.discounts.findUnique({
      where: { code: formattedCode },
    });

    if (existingCode) {
      throw new BadRequestException('Mã giảm giá này đã tồn tại!');
    }

    const startDate = new Date(dto.start_date);
    const endDate = new Date(dto.end_date);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Ngày giờ bắt đầu hoặc kết thúc không hợp lệ!');
    }

    if (startDate >= endDate) {
      throw new BadRequestException('Thời gian kết thúc phải diễn ra sau thời gian bắt đầu!');
    }

    return this.prisma.discounts.create({
      data: {
        code: formattedCode,
        description: dto.description || '',
        discount_type: dto.discount_type || 'PERCENTAGE',
        discount_value: Number(dto.discount_value),
        min_order_value: dto.min_order_value ? Number(dto.min_order_value) : 0,
        max_discount: dto.max_discount ? Number(dto.max_discount) : null,
        usage_limit: dto.usage_limit ? Number(dto.usage_limit) : null,
        start_date: startDate,
        end_date: endDate,
        is_active: dto.is_active ?? true,
      },
    });
  }

  // 2. LẤY DANH SÁCH & TỰ ĐỘNG XÁC ĐỊNH TRẠNG THÁI THEO THỜI GIAN
  async findAll() {
    const discounts = await this.prisma.discounts.findMany({
      orderBy: { created_at: 'desc' },
    });

    const now = new Date();

    return discounts.map((d) => {
      const start = new Date(d.start_date);
      const end = new Date(d.end_date);

      let timeStatus = 'ACTIVE'; // Đang trong khung giờ
      if (now < start) {
        timeStatus = 'COMING_SOON'; // Chưa đến giờ mở
      } else if (now > end) {
        timeStatus = 'EXPIRED'; // Đã hết hạn
      }

      return {
        ...d,
        time_status: timeStatus,
      };
    });
  }

  // 3. ÁP DỤNG MÃ (TỰ ĐỘNG CHẶN NẾU CHƯA TỚI GIỜ HOẶC QUÁ GIỜ)
  async applyDiscount(dto: ApplyDiscountDto) {
    const formattedCode = dto.code.trim().toUpperCase();

    const discount = await this.prisma.discounts.findUnique({
      where: { code: formattedCode },
    });

    if (!discount) {
      throw new NotFoundException('Mã giảm giá không tồn tại!');
    }

    if (!discount.is_active) {
      throw new BadRequestException('Mã giảm giá này đang bị vô hiệu hóa thủ công!');
    }

    const now = new Date();
    const start = new Date(discount.start_date);
    const end = new Date(discount.end_date);

    if (now < start) {
      throw new BadRequestException(
        `Mã này chưa đến giờ mở! Hiệu lực từ: ${start.toLocaleString('vi-VN')}`
      );
    }
    if (now > end) {
      throw new BadRequestException(
        `Mã này đã hết hạn lúc: ${end.toLocaleString('vi-VN')}`
      );
    }

    if (discount.usage_limit && discount.used_count >= discount.usage_limit) {
      throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng!');
    }

    const orderTotal = Number(dto.order_subtotal || 0);

    if (discount.min_order_value && orderTotal < Number(discount.min_order_value)) {
      throw new BadRequestException(
        `Đơn hàng chưa đạt giá trị tối thiểu ${Number(discount.min_order_value).toLocaleString('vi-VN')}đ!`
      );
    }

    let discountAmount = 0;
    if (discount.discount_type === 'FIXED_AMOUNT') {
      discountAmount = Number(discount.discount_value);
    } else if (discount.discount_type === 'PERCENTAGE') {
      discountAmount = (orderTotal * Number(discount.discount_value)) / 100;
      if (discount.max_discount && discountAmount > Number(discount.max_discount)) {
        discountAmount = Number(discount.max_discount);
      }
    }

    discountAmount = Math.min(discountAmount, orderTotal);

    return {
      valid: true,
      discount_id: discount.id,
      code: discount.code,
      discount_type: discount.discount_type,
      discount_value: discount.discount_value,
      discount_amount: discountAmount,
      final_subtotal: Math.max(0, orderTotal - discountAmount),
    };
  }

  async findOne(id: string) {
    const discount = await this.prisma.discounts.findUnique({ where: { id } });
    if (!discount) throw new NotFoundException('Mã giảm giá không tồn tại!');
    return discount;
  }

  async toggleActive(id: string) {
    const discount = await this.findOne(id);
    return this.prisma.discounts.update({
      where: { id },
      data: { is_active: !discount.is_active },
    });
  }

  async update(id: string, dto: UpdateDiscountsDto) {
    await this.findOne(id);
    return this.prisma.discounts.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.code && { code: dto.code.trim().toUpperCase() }),
        ...(dto.start_date && { start_date: new Date(dto.start_date) }),
        ...(dto.end_date && { end_date: new Date(dto.end_date) }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.discounts.delete({ where: { id } });
  }
}