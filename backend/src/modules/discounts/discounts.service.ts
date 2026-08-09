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

  // 1. TẠO MỚI MÃ GIẢM GIÁ
  async create(dto: CreateDiscountDto) {
    const existingCode = await this.prisma.discounts.findUnique({
      where: { code: dto.code },
    });

    if (existingCode) {
      throw new BadRequestException('Mã giảm giá này đã tồn tại!');
    }

    return this.prisma.discounts.create({
      data: {
        code: dto.code,
        description: dto.description,
        discount_type: dto.discount_type,
        discount_value: dto.discount_value,
        min_order_value: dto.min_order_value ?? 0,
        max_discount: dto.max_discount,
        usage_limit: dto.usage_limit,
        start_date: new Date(dto.start_date),
        end_date: new Date(dto.end_date),
        is_active: dto.is_active ?? true,
      },
    });
  }

  // 2. LẤY DANH SÁCH MÃ GIẢM GIÁ
  async findAll() {
    return this.prisma.discounts.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  // 3. XEM CHI TIẾT 1 MÃ GIẢM GIÁ
  async findOne(id: string) {
    const discount = await this.prisma.discounts.findUnique({ where: { id } });
    if (!discount) throw new NotFoundException('Mã giảm giá không tồn tại!');
    return discount;
  }

  // 4. KIỂM TRA & ÁP DỤNG MÃ GIẢM GIÁ (DÀNH CHO ĐẶT HÀNG)
  async applyDiscount(dto: ApplyDiscountDto) {
    const discount = await this.prisma.discounts.findUnique({
      where: { code: dto.code },
    });

    if (!discount) {
      throw new NotFoundException('Mã giảm giá không tồn tại!');
    }

    if (!discount.is_active) {
      throw new BadRequestException('Mã giảm giá này hiện đã ngừng hoạt động!');
    }

    const now = new Date();
    if (now < new Date(discount.start_date) || now > new Date(discount.end_date)) {
      throw new BadRequestException('Mã giảm giá đã hết hạn hoặc chưa tới thời gian sử dụng!');
    }

    if (discount.usage_limit && discount.used_count >= discount.usage_limit) {
      throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng!');
    }

    if (Number(dto.order_subtotal) < Number(discount.min_order_value)) {
      throw new BadRequestException(
        `Đơn hàng chưa đạt giá trị tối thiểu ${Number(discount.min_order_value).toLocaleString('vi-VN')}đ để áp dụng mã này!`,
      );
    }

    let discountAmount = 0;
    if (discount.discount_type === 'FIXED_AMOUNT') {
      discountAmount = Number(discount.discount_value);
    } else if (discount.discount_type === 'PERCENTAGE') {
      discountAmount = (Number(dto.order_subtotal) * Number(discount.discount_value)) / 100;
      if (discount.max_discount && discountAmount > Number(discount.max_discount)) {
        discountAmount = Number(discount.max_discount);
      }
    }

    discountAmount = Math.min(discountAmount, Number(dto.order_subtotal));

    return {
      discount_id: discount.id,
      code: discount.code,
      discount_amount: discountAmount,
      final_subtotal: Number(dto.order_subtotal) - discountAmount,
    };
  }

  // 5. CẬP NHẬT MÃ GIẢM GIÁ (Hàm gây ra lỗi TS2339 nếu thiếu)
  async update(id: string, dto: UpdateDiscountsDto) {
    await this.findOne(id);
    return this.prisma.discounts.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.start_date && { start_date: new Date(dto.start_date) }),
        ...(dto.end_date && { end_date: new Date(dto.end_date) }),
      },
    });
  }

  // 6. XÓA MÃ GIẢM GIÁ
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.discounts.delete({ where: { id } });
  }
}