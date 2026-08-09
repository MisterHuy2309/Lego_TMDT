import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart.dto';

@ApiTags('Cart (Giỏ hàng)')
@Controller('api/v1/cart') // 🟢 Giữ nguyên route này
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  @ApiOperation({ summary: 'Thêm sản phẩm vào giỏ hàng' })
  addToCart(@Request() req: any, @Body() dto: AddToCartDto) {
    const userId = req.user?.id || req.user?.sub;
    return this.cartService.addToCart(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Xem giỏ hàng cá nhân & tính tạm tính' })
  getCart(@Request() req: any) {
    // 🟢 Bắt userId an toàn, tránh bị undefined làm sập query Prisma
    const userId = req.user?.id || req.user?.sub;
    return this.cartService.getCart(userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Sửa số lượng món trong giỏ hàng' })
  updateQuantity(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateCartItemDto) {
    const userId = req.user?.id || req.user?.sub;
    return this.cartService.updateQuantity(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa 1 món khỏi giỏ hàng' })
  removeItem(@Request() req: any, @Param('id') id: string) {
    const userId = req.user?.id || req.user?.sub;
    return this.cartService.removeItem(userId, id);
  }
}