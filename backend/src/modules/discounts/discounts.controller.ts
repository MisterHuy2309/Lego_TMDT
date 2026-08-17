import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles, RolesGuard } from '../auth/roles.guard';
import { DiscountsService } from './discounts.service';
import {
  ApplyDiscountDto,
  CreateDiscountDto,
} from './dto/create-discounts.dto';
import { UpdateDiscountsDto } from './dto/update-discounts.dto';

@ApiTags('Discounts (Quản lý mã giảm giá)')
@Controller(['api/v1/discounts', 'discounts'])
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  // 🟢 1. TẠO MÃ GIẢM GIÁ
  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[ADMIN] Tạo mã giảm giá mới' })
  create(@Body() dto: CreateDiscountDto) {
    return this.discountsService.create(dto);
  }

  // 🟢 2. LẤY TẤT CẢ MÃ GIẢM GIÁ
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách mã giảm giá' })
  findAll() {
    return this.discountsService.findAll();
  }

  // 🟢 3. ÁP DỤNG MÃ GIẢM GIÁ KHI CHECKOUT (DÀNH CHO CLIENT/USER)
  @Post('apply')
  @ApiOperation({ summary: 'Kiểm tra & áp dụng mã giảm giá tính tiền' })
  applyDiscount(@Body() dto: ApplyDiscountDto) {
    return this.discountsService.applyDiscount(dto);
  }

  // 🟢 4. XEM CHI TIẾT 1 MÃ GIẢM GIÁ
  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết 1 mã giảm giá' })
  findOne(@Param('id') id: string) {
    return this.discountsService.findOne(id);
  }

  // 🟢 5. BẬT / TẮT NHANH TRẠNG THÁI MÃ GIẢM GIÁ (DÀNH CHO ADMIN)
  @Patch(':id/toggle')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[ADMIN] Bật / Tắt kích hoạt mã giảm giá' })
  toggle(@Param('id') id: string) {
    return this.discountsService.toggleActive(id);
  }

  // 🟢 6. CẬP NHẬT CHI TIẾT MÃ GIẢM GIÁ
  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[ADMIN] Cập nhật mã giảm giá' })
  update(@Param('id') id: string, @Body() dto: UpdateDiscountsDto) {
    return this.discountsService.update(id, dto);
  }

  // 🟢 7. XÓA MÃ GIẢM GIÁ
  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[ADMIN] Xóa mã giảm giá' })
  remove(@Param('id') id: string) {
    return this.discountsService.remove(id);
  }
}