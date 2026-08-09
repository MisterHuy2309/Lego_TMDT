import { Module } from '@nestjs/common';
import { DiscountsController } from './discounts.controller';
import { DiscountsService } from './discounts.service';

@Module({
  controllers: [DiscountsController],
  providers: [DiscountsService],
  exports: [DiscountsService], // 👈 Rất quan trọng: Export service để OrdersModule dùng được
})
export class DiscountsModule {}