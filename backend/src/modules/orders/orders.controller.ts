import {
  Body,
  Controller,
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
@Controller('api/v1/orders')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // 🛒 1. [CLIENT] Đặt hàng mới
  @Post()
  @ApiOperation({ summary: 'Đặt hàng (Trừ kho, áp mã voucher, xóa giỏ hàng)' })
  createOrder(@Request() req: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(req.user.id, dto);
  }

  // 📦 2. [CLIENT] Xem danh sách đơn hàng của tôi
  @Get('my-orders')
  @ApiOperation({ summary: 'Xem lịch sử đơn hàng cá nhân' })
  getMyOrders(@Request() req: any) {
    return this.ordersService.getMyOrders(req.user.id);
  }

  // 📊 3. [ADMIN] Lấy tất cả đơn hàng & Thống kê doanh thu realtime
  @Get('admin/all')
  @ApiOperation({ summary: '[ADMIN] Lấy tất cả đơn hàng & thống kê doanh thu' })
  getAdminOrders(@Request() req: any) {
    const isAdmin = req.user.role === 'ADMIN';
    return this.ordersService.getAdminOrders(isAdmin);
  }

  // 🚚 4. [ADMIN] Cập nhật trạng thái đơn hàng (PENDING -> CONFIRMED -> DELIVERED / CANCELLED)
  @Patch('admin/:id/status')
  @ApiOperation({ summary: '[ADMIN] Cập nhật trạng thái đơn hàng' })
  updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Request() req: any,
  ) {
    const isAdmin = req.user.role === 'ADMIN';
    return this.ordersService.updateOrderStatus(id, dto.status, isAdmin);
  }
}