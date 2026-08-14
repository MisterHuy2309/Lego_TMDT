import { Module } from '@nestjs/common';
import { AdminSettingsService } from './adminseting.service';
import { AdminSettingsController } from './adminseting.controller';

@Module({
  controllers: [AdminSettingsController],
  providers: [AdminSettingsService],
  exports: [AdminSettingsService],
})
export class AdminsetingModule {}