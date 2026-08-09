import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders (Đơn hàng & Thanh toán)')
@Controller('api/v1/orders')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Đặt hàng (Trừ kho, áp mã voucher, xóa giỏ hàng)' })
  createOrder(@Request() req: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(req.user.id, dto);
  }

  @Get('my-orders')
  @ApiOperation({ summary: 'Xem lịch sử đơn hàng cá nhân' })
  getMyOrders(@Request() req: any) {
    return this.ordersService.getMyOrders(req.user.id);
  }
}