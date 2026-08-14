// backend/src/modules/admin-settings/tasks.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AdminSettingsService } from './adminseting.service';
@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly settingsService: AdminSettingsService) {}

  // 🕛 Tự động chạy quét dọn bản sao lưu hết hạn vào lúc 00:00 mỗi đêm
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCronPurgeBackups() {
    this.logger.log('Bắt đầu dọn dẹp các bản sao lưu doanh thu quá 30 ngày...');
    const result = await this.settingsService.autoPurgeExpiredBackups();
    this.logger.log(`Đã xóa tự động ${result.purged_count} bản sao lưu hết hạn.`);
  }
}