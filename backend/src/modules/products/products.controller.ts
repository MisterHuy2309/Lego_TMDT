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
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@ApiTags('Products')
@Controller(['api/v1/products', 'products'])
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ============================================================================
  // 🟢 1. PUBLIC: LẤY DANH SÁCH & CHI TIẾT SẢN PHẨM
  // ============================================================================

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách sản phẩm' })
  findAll() {
    return this.productsService.findAll();
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Lấy chi tiết sản phẩm theo Slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  // ============================================================================
  // 🛠️ 2. ADMIN: CÁC THAO TÁC HÀNG LOẠT (BULK ACTIONS)
  // Lưu ý: Đặt trước route ':id' để tránh xung đột routing
  // ============================================================================

  @Post('admin/bulk-discount')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[ADMIN] Áp dụng / Gỡ mã giảm giá cho nhiều sản phẩm' })
  applyBulkDiscount(
    @Body() body: { product_ids: string[]; discount_id: string | null },
  ) {
    return this.productsService.applyDiscountToProducts(
      body.product_ids,
      body.discount_id,
    );
  }

  @Post('admin/bulk-delete')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[ADMIN] Xóa nhiều sản phẩm đã chọn' })
  bulkDelete(@Body() body: { product_ids: string[] }) {
    return this.productsService.deleteManyProducts(body.product_ids);
  }

  // ============================================================================
  // 🟢 3. PUBLIC: LẤY CHI TIẾT THEO ID
  // ============================================================================

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết sản phẩm theo ID' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  // ============================================================================
  // 🛠️ 4. ADMIN: CRUD SẢN PHẨM
  // ============================================================================

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[ADMIN] Tạo sản phẩm Lego mới' })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[ADMIN] Cập nhật sản phẩm & tồn kho SKU' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[ADMIN] Xóa sản phẩm đơn lẻ' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
} 