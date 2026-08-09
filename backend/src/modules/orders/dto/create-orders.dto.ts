
import {Prisma} from '@prisma/client'
import {ApiProperty,getSchemaPath} from '@nestjs/swagger'




export class CreateOrdersDto {
  order_code: string;
@ApiProperty({
  type: `number`,
  format: `double`,
})
total_amount: Prisma.Decimal;
payment_method: string;
}
