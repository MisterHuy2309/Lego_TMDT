import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { CategoriesService } from './categories.service';
import { CreateCategoriesDto } from './dto/create-categories.dto';
import { UpdateCategoriesDto } from './dto/update-categories.dto';

@ApiTags('Categories (Danh mục sản phẩm)')
@Controller('api/v1/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // 🌐 PUBLIC: Lấy toàn bộ Cây danh mục (Cha -> Con -> Sản phẩm) làm Menu Frontend
  @Get('tree')
  @ApiOperation({ summary: 'Lấy cây danh mục phân cấp kèm danh mục con và sản phẩm' })
  findTree() {
    return this.categoriesService.findTree();
  }

  // 🌐 PUBLIC: Lấy danh sách danh mục phẳng
  @Get()
  @ApiOperation({ summary: 'Lấy tất cả danh mục (Danh sách phẳng)' })
  findAll() {
    return this.categoriesService.findAll();
  }

  // 🌐 PUBLIC: Xem chi tiết 1 danh mục
  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết 1 danh mục kèm danh mục con và sản phẩm' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  // 🔒 ADMIN ONLY: Tạo danh mục mới (Có thể là danh mục Gốc hoặc Con)
  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[ADMIN] Tạo danh mục mới (Truyền parent_id nếu muốn làm danh mục con)' })
  create(@Body() dto: CreateCategoriesDto) {
    return this.categoriesService.create(dto);
  }

  // 🔒 ADMIN ONLY: Cập nhật danh mục
  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[ADMIN] Cập nhật danh mục' })
  update(@Param('id') id: string, @Body() dto: UpdateCategoriesDto) {
    return this.categoriesService.update(id, dto);
  }

  // 🔒 ADMIN ONLY: Xóa danh mục
  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[ADMIN] Xóa danh mục' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}