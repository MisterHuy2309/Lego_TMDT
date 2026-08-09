import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

import { DiscountsService } from '../discounts/discounts.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly discountsService: DiscountsService,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    // 1. Kiểm tra địa chỉ nhận hàng
    const address = await this.prisma.addresses.findFirst({
      where: { id: dto.address_id, user_id: userId },
    });
    if (!address) throw new NotFoundException('Địa chỉ nhận hàng không hợp lệ');

    // 2. Lấy giỏ hàng
    const cartItems = await this.prisma.cart_items.findMany({
      where: { user_id: userId },
      include: { sku: { include: { product: true } } },
    });

    if (cartItems.length === 0) {
      throw new BadRequestException('Giỏ hàng của bạn đang rỗng');
    }

    // 3. Thực hiện Database Transaction để trừ kho & tạo order an toàn
    return this.prisma.$transaction(async (tx) => {
      let subtotal = 0;

      // 3.1 Kiểm tra tồn kho và tính subtotal
      for (const item of cartItems) {
        if (item.sku.stock_quantity < item.quantity) {
          throw new BadRequestException(
            `Sản phẩm "${item.sku.product.name}" (${item.sku.sku_code}) chỉ còn ${item.sku.stock_quantity} món trong kho`,
          );
        }
        subtotal += Number(item.sku.price) * item.quantity;
      }

      // 3.2 Xử lý mã giảm giá (nếu có)
      let discountId: string | null = null;
      let discountAmount = 0;

      if (dto.discount_code) {
        const discountRes = await this.discountsService.applyDiscount({
          code: dto.discount_code,
          order_subtotal: subtotal,
        });
        discountId = discountRes.discount_id;
        discountAmount = discountRes.discount_amount;

        // Tăng lượt sử dụng của mã giảm giá (Dùng `discountId as string` để ép kiểu không bị null)
        await tx.discounts.update({
          where: { id: discountId as string },
          data: { used_count: { increment: 1 } },
        });
      }

      const shippingFee = 30000; // Mặc định phí ship 30k
      const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

      // Sinh mã đơn hàng duy nhất (ví dụ: LEGO-20260808-A1B2)
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
      const orderCode = `LEGO-${dateStr}-${randomStr}`;

      // 3.3 Trừ kho sản phẩm
      for (const item of cartItems) {
        await tx.product_skus.update({
          where: { id: item.sku_id },
          data: { stock_quantity: { decrement: item.quantity } },
        });
      }

      // 3.4 Tạo đơn hàng
      const order = await tx.orders.create({
        data: {
          user_id: userId,
          address_id: dto.address_id,
          discount_id: discountId,
          order_code: orderCode,
          status: 'PENDING',
          total_amount: totalAmount,
          discount_amount: discountAmount,
          shipping_fee: shippingFee,
          payment_method: dto.payment_method,
          order_items: {
            create: cartItems.map((item) => ({
              sku_id: item.sku_id,
              price_at_purchase: item.sku.price,
              quantity: item.quantity,
            })),
          },
          payments: {
            create: {
              provider: dto.payment_method,
              amount: totalAmount, // Bổ sung bắt buộc cho Schema Payments mới
              status: 'PENDING',
            },
          },
        },
      });

      // 3.5 Xóa giỏ hàng
      await tx.cart_items.deleteMany({ where: { user_id: userId } });

      return {
        message: 'Đặt hàng thành công',
        order_id: order.id,
        order_code: order.order_code,
        total_amount: totalAmount,
        payment_method: dto.payment_method,
      };
    });
  }

  async getMyOrders(userId: string) {
    return this.prisma.orders.findMany({
      where: { user_id: userId },
      include: {
        order_items: {
          include: {
            sku: {
              include: { product: { select: { name: true, item_number: true } } },
            },
          },
        },
        address: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }
}