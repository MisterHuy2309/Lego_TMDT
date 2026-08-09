import {Body,Controller,Delete,Get,Param,Patch,Post,UseGuards} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles, RolesGuard } from '../auth/roles.guard';
import { DiscountsService } from './discounts.service';
import { CreateDiscountDto } from './dto/create-discounts.dto';
import { UpdateDiscountsDto } from './dto/update-discounts.dto';

@ApiTags('Discounts (Quản lý mã giảm giá)')
@Controller('api/v1/discounts')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[ADMIN] Tạo mã giảm giá mới' })
  create(@Body() dto: CreateDiscountDto) {
    return this.discountsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách mã giảm giá' })
  findAll() {
    return this.discountsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết 1 mã giảm giá' })
  findOne(@Param('id') id: string) {
    return this.discountsService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[ADMIN] Cập nhật mã giảm giá' })
  update(@Param('id') id: string, @Body() dto: UpdateDiscountsDto) {
    return this.discountsService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[ADMIN] Xóa mã giảm giá' })
  remove(@Param('id') id: string) {
    return this.discountsService.remove(id);
  }
}