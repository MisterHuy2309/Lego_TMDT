import { Body, Controller,Get, Param, Patch, Post, Query, Request, UseGuards,} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles, RolesGuard } from '../auth/roles.guard';
import { CreatePaymentUrlDto, RefundPaymentDto } from './dto/payments.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments (Thanh toán, Cổng VNPay/ZaloPay & Hoàn tiền)')
@Controller('api/v1/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // 💳 1. TẠO URL THANH TOÁN ONLINE
  @Post('create-url')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Tạo liên kết thanh toán trực tuyến (VNPay / ZaloPay)' })
  createPaymentUrl(@Body() dto: CreatePaymentUrlDto) {
    return this.paymentsService.createPaymentUrl(dto);
  }

  // 🔔 2. WEBHOOK / IPN TỪ VNPAY (CỔNG THANH TOÁN GỌI VỀ TỰ ĐỘNG)
  @Get('vnpay-ipn')
  @ApiOperation({ summary: '[WEBHOOK] Cổng VNPay gọi tự động để phản hồi kết quả thanh toán' })
  handleVnPayIpn(@Query() query: Record<string, any>) {
    return this.paymentsService.handleVnPayIpn(query);
  }

  // 📜 3. LẤY LỊCH SỬ THANH TOÁN CỦA TÔI
  @Get('my-payments')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Lấy danh sách lịch sử giao dịch thanh toán của người dùng' })
  getMyPayments(@Request() req: any) {
    return this.paymentsService.getMyPayments(req.user.id);
  }

  // 🛠️ 4. [ADMIN] XÁC NHẬN THU TIỀN COD
  @Patch('admin/confirm-cod/:paymentId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[ADMIN] Xác nhận khách đã thanh toán đơn COD' })
  confirmCodPayment(@Param('paymentId') paymentId: string) {
    return this.paymentsService.confirmCodPayment(paymentId);
  }

  // 🔄 5. [ADMIN] HOÀN TIỀN
  @Post('admin/refund/:paymentId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[ADMIN] Xử lý hoàn tiền cho giao dịch' })
  processRefund(
    @Param('paymentId') paymentId: string,
    @Body() dto: RefundPaymentDto,
  ) {
    return this.paymentsService.processRefund(paymentId, dto);
  }
}