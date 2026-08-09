import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@ApiTags('Products')
@Controller('api/v1/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // 1. PUBLIC: Lấy danh sách tất cả sản phẩm
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách sản phẩm' })
  findAll() {
    return this.productsService.findAll();
  }

  // 🟢 2. PUBLIC: Lấy chi tiết sản phẩm THEO SLUG (Cho trang chi tiết Frontend)
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Lấy chi tiết sản phẩm theo Slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug); // Bổ sung hàm findBySlug trong ProductsService
  }

  // 🟢 3. PUBLIC: Lấy chi tiết sản phẩm THEO ID
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết sản phẩm theo ID' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  // ADMIN ONLY: Tạo sản phẩm
  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[ADMIN] Tạo sản phẩm Lego mới' })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  // ADMIN ONLY: Cập nhật
  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[ADMIN] Cập nhật sản phẩm' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  // ADMIN ONLY: Xóa
  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[ADMIN] Xóa sản phẩm' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}