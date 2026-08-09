
import {Prisma} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'


export class OrdersDto {
  id!: string ;
order_code!: string ;
status!: string ;
@ApiProperty({
  type: `number`,
  format: `double`,
})
total_amount!: Prisma.Decimal ;
@ApiProperty({
  type: `number`,
  format: `double`,
})
discount_amount!: Prisma.Decimal ;
@ApiProperty({
  type: `number`,
  format: `double`,
})
shipping_fee!: Prisma.Decimal ;
payment_method!: string ;
@ApiProperty({
  type: `string`,
  format: `date-time`,
})
created_at!: Date ;
}
