
import {Prisma} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'
import {OrdersEntity} from '../../orders/entities/orders.entity'


export class DiscountsEntity {
  id: string ;
code: string ;
description: string  | null;
discount_type: string ;
@ApiProperty({
  type: `number`,
  format: `double`,
})
discount_value: Prisma.Decimal ;
@ApiProperty({
  type: `number`,
  format: `double`,
})
min_order_value: Prisma.Decimal ;
@ApiProperty({
  type: `number`,
  format: `double`,
})
max_discount: Prisma.Decimal  | null;
@ApiProperty({
  type: `integer`,
  format: `int32`,
})
usage_limit: number  | null;
@ApiProperty({
  type: `integer`,
  format: `int32`,
})
used_count: number ;
@ApiProperty({
  type: `string`,
  format: `date-time`,
})
start_date: Date ;
@ApiProperty({
  type: `string`,
  format: `date-time`,
})
end_date: Date ;
is_active: boolean ;
@ApiProperty({
  type: `string`,
  format: `date-time`,
})
created_at: Date ;
orders?: OrdersEntity[] ;
}
