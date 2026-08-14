// backend/src/modules/adminseting/adminseting.controller.ts

import {
  Body,
  Controller,
  Delete, // 🟢 Import Delete
  Get,
  Param,  // 🟢 Import Param
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { AdminSettingsService } from './adminseting.service';
import { ResetRevenueDto, SetPinDto } from './dto/admin-settings.dto';

@ApiTags('Admin Settings (Cài đặt hệ thống Admin)')
@Controller(['api/v1/admin/settings', 'admin/settings'])
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminSettingsController {
  constructor(private readonly settingsService: AdminSettingsService) {}

  @Post('pin')
  @ApiOperation({ summary: 'Cài đặt hoặc đổi mã PIN 6 số (Yêu cầu mật khẩu Admin)' })
  setupPin(@Request() req: any, @Body() dto: SetPinDto) {
    return this.settingsService.setupAdminPin(req.user.id || req.user.sub, dto);
  }

  @Post('reset-revenue')
  @ApiOperation({ summary: 'Reset doanh thu bằng mã PIN (Lưu backup 30 ngày)' })
  resetRevenue(@Request() req: any, @Body() dto: ResetRevenueDto) {
    return this.settingsService.resetRevenue(req.user.id || req.user.sub, dto);
  }

  @Get('revenue-backups')
  @ApiOperation({ summary: 'Xem danh sách bản sao lưu doanh thu trong 30 ngày' })
  getBackups() {
    return this.settingsService.getRevenueBackups();
  }

  // 🟢 THÊM ENDPOINT XÓA BACKUP
  @Delete('revenue-backups/:id')
  @ApiOperation({ summary: 'Xóa thủ công một bản sao lưu doanh thu' })
  deleteBackup(@Param('id') id: string) {
    return this.settingsService.deleteBackup(id);
  }
}