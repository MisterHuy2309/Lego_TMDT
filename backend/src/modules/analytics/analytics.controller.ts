import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { AnalyticsService } from './analytics.service';
import { QueryRevenueDto } from './dto/query-analytics.dto';

@ApiTags('Admin - Analytics & Inventory (Doanh Thu & Quản Lý Kho)')
@Controller('api/v1/admin/analytics')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('revenue')
  @ApiOperation({ summary: '[ADMIN] Báo cáo doanh thu theo Ngày / Tuần / Tháng / Năm' })
  getRevenueReport(@Query() query: QueryRevenueDto) {
    return this.analyticsService.getRevenueReport(query);
  }

  @Get('products-performance')
  @ApiOperation({ summary: '[ADMIN] Xem danh sách sản phẩm bán chạy nhất' })
  getProductPerformance() {
    return this.analyticsService.getProductPerformance();
  }

  @Get('inventory')
  @ApiOperation({ summary: '[ADMIN] Báo cáo tổng quan Kho Hàng (Tồn kho, Cảnh báo sắp hết, Hàng đọng lâu, Hàng mới)' })
  @ApiQuery({ name: 'threshold', required: false, example: 5, description: 'Mức ngưỡng cảnh báo sắp hết hàng (Mặc định: 5)' })
  getInventoryReport(@Query('threshold') threshold?: string) {
    const limit = threshold ? parseInt(threshold, 10) : 5;
    return this.analyticsService.getInventoryReport(limit);
  }
}