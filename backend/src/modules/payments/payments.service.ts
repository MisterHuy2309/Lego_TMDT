import {BadRequestException,Injectable, NotFoundException,} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

import {CreatePaymentUrlDto,PaymentProvider,PaymentStatus,RefundPaymentDto} from './dto/payments.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Tạo liên kết thanh toán VNPay / ZaloPay
  async createPaymentUrl(dto: CreatePaymentUrlDto) {
    const order = await this.prisma.orders.findUnique({
      where: { id: dto.order_id },
      include: { payments: true },
    });

    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }

    if (order.status === 'CANCELLED') {
      throw new BadRequestException('Đơn hàng này đã bị hủy');
    }

    const amount = Number(order.total_amount);

    // Xử lý theo từng cổng thanh toán
    if (dto.provider === PaymentProvider.VNPAY) {
      // Giả lập/Tạo URL VNPay (Tích hợp VNPay SDK ở đây)
      const paymentUrl = `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=${
        amount * 100
      }&vnp_OrderInfo=Thanh+toan+don+hang+${order.order_code}&vnp_TxnRef=${order.order_code}`;

      return {
        order_code: order.order_code,
        amount,
        payment_url: paymentUrl,
      };
    }

    if (dto.provider === PaymentProvider.COD) {
      return {
        message: 'Đơn hàng thanh toán bằng phương thức COD',
        order_code: order.order_code,
        amount,
      };
    }

    throw new BadRequestException('Phương thức thanh toán chưa được hỗ trợ');
  }

  // 2. Xử lý Webhook / IPN từ Cổng thanh toán (VNPayCallback)
  // 2. Xử lý Webhook / IPN từ Cổng thanh toán (VNPayCallback)
  async handleVnPayIpn(query: Record<string, any>) {
    // 👈 Bổ sung kiểm tra tham số vnp_TxnRef
    const orderCode = query.vnp_TxnRef;
    const responseCode = query.vnp_ResponseCode;

    // Nếu vnp_TxnRef bị trống/undefined, trả về lỗi IPN ngay lập tức tránh nổ Prisma
    if (!orderCode || typeof orderCode !== 'string') {
      return { RspCode: '99', Message: 'Invalid order_code or missing vnp_TxnRef' };
    }

    const order = await this.prisma.orders.findUnique({
      where: { order_code: orderCode },
      include: { payments: true },
    });

    if (!order) {
      return { RspCode: '01', Message: 'Order not found' };
    }

    const payment = order.payments[0];
    if (!payment) {
      return { RspCode: '02', Message: 'Payment record not found' };
    }

    if (responseCode === '00') {
      // Đổi trạng thái Payment & Order
      await this.prisma.$transaction([
        this.prisma.payments.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.SUCCESS,
            transaction_code: query.vnp_TransactionNo || 'VNP' + Date.now(),
            paid_at: new Date(),
          },
        }),
        this.prisma.orders.update({
          where: { id: order.id },
          data: { status: 'PROCESSING' },
        }),
      ]);

      return { RspCode: '00', Message: 'Confirm Success' };
    } else {
      // Thanh toán thất bại
      await this.prisma.payments.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          failure_reason: `VNPay Response Code: ${responseCode}`,
        },
      });

      return { RspCode: '00', Message: 'Confirm Success (Failed status recorded)' };
    }
  }

  // 3. [ADMIN] Xác nhận đã thu tiền COD
  async confirmCodPayment(paymentId: string) {
    const payment = await this.prisma.payments.findUnique({
      where: { id: paymentId },
    });

    if (!payment) throw new NotFoundException('Bản ghi thanh toán không tồn tại');
    if (payment.status === PaymentStatus.SUCCESS) {
      throw new BadRequestException('Thanh toán này đã được xác nhận trước đó');
    }

    return this.prisma.$transaction([
      this.prisma.payments.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.SUCCESS,
          paid_at: new Date(),
        },
      }),
      this.prisma.orders.update({
        where: { id: payment.order_id },
        data: { status: 'DELIVERED' },
      }),
    ]);
  }

  // 4. [ADMIN] Xử lý Hoàn tiền (Refund)
  async processRefund(paymentId: string, dto: RefundPaymentDto) {
    const payment = await this.prisma.payments.findUnique({
      where: { id: paymentId },
    });

    if (!payment) throw new NotFoundException('Không tìm thấy bản ghi thanh toán');
    if (payment.status !== PaymentStatus.SUCCESS) {
      throw new BadRequestException('Chỉ có thể hoàn tiền cho giao dịch đã thanh toán thành công');
    }

    const refundCode = `REF-${Date.now()}`;

    return this.prisma.$transaction([
      this.prisma.refunds.create({
        data: {
          payment_id: paymentId,
          amount: dto.amount,
          status: 'SUCCESS',
          refund_code: refundCode,
          reason: dto.reason,
          completed_at: new Date(),
        },
      }),
      this.prisma.payments.update({
        where: { id: paymentId },
        data: { status: PaymentStatus.REFUNDED },
      }),
      this.prisma.orders.update({
        where: { id: payment.order_id },
        data: { status: 'CANCELLED' },
      }),
    ]);
  }

  // 5. Lấy danh sách thanh toán của tôi
  async getMyPayments(userId: string) {
    return this.prisma.payments.findMany({
      where: { order: { user_id: userId } },
      include: {
        order: {
          select: { order_code: true, total_amount: true, status: true },
        },
        refunds: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }
}