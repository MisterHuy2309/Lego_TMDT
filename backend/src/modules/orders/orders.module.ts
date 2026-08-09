import { Module } from '@nestjs/common';
import { DiscountsModule } from '../discounts/discounts.module'; // 👈 Dòng import này
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [DiscountsModule], // 👈 Thêm vào imports
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}