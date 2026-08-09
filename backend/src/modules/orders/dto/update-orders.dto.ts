
import {Prisma} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'




export class UpdateOrdersDto {
  order_code?: string;
@ApiProperty({
  type: `number`,
  format: `double`,
})
total_amount?: Prisma.Decimal;
payment_method?: string;
}
