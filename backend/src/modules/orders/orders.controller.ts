import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders (Đơn hàng & Thanh toán)')
@Controller(['api/v1/orders', 'orders'])
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ============================================================================
  // 🛒 1. [CLIENT] ĐẶT HÀNG MỚI
  // ============================================================================
  @Post()
  @ApiOperation({ summary: 'Đặt hàng (Trừ kho, áp mã voucher, xóa giỏ hàng)' })
  createOrder(@Request() req: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(req.user.id, dto);
  }

  // ============================================================================
  // 📦 2. [CLIENT] LẤY DANH SÁCH ĐƠN HÀNG CỦA TÔI
  // ============================================================================
  @Get('my-orders')
  @ApiOperation({ summary: 'Xem lịch sử đơn hàng cá nhân' })
  getMyOrders(@Request() req: any) {
    return this.ordersService.getMyOrders(req.user.id);
  }

  // ============================================================================
  // 🗑️ 3. [CLIENT] XÓA / ẨN LỊCH SỬ ĐƠN HÀNG (KHI ĐÃ GIAO HOẶC ĐÃ HỦY)
  // ============================================================================
  @Delete('my-orders/:id')
  @ApiOperation({ summary: '[CLIENT] Xóa/ẩn lịch sử đơn hàng đã kết thúc' })
  hideOrderHistory(@Request() req: any, @Param('id') orderId: string) {
    return this.ordersService.hideOrderHistory(req.user.id, orderId);
  }

  // ============================================================================
  // 📊 4. [ADMIN] LẤY TẤT CẢ ĐƠN HÀNG & DOANH THU REALTIME
  // ============================================================================
  @Get('admin/all')
  @ApiOperation({ summary: '[ADMIN] Lấy tất cả đơn hàng & thống kê doanh thu' })
  getAdminOrders(@Request() req: any) {
    const isAdmin = req.user.role === 'ADMIN';
    return this.ordersService.getAdminOrders(isAdmin);
  }

  // ============================================================================
  // 🚚 5. [ADMIN] CẬP NHẬT TRẠNG THÁI (PENDING -> CONFIRMED -> SHIPPED -> DELIVERED / CANCELLED)
  // ============================================================================
  @Patch('admin/:id/status')
  @ApiOperation({ summary: '[ADMIN] Cập nhật trạng thái quy trình đơn hàng' })
  updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Request() req: any,
  ) {
    const isAdmin = req.user.role === 'ADMIN';
    return this.ordersService.updateOrderStatus(id, dto.status, isAdmin);
  }
}