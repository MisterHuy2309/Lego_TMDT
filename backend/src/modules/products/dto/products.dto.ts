
import {Prisma} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'


export class ProductsDto {
  id: string ;
name: string ;
slug: string ;
description: string  | null;
item_number: string  | null;
@ApiProperty({
  type: `integer`,
  format: `int32`,
})
piece_count: number  | null;
@ApiProperty({
  type: `integer`,
  format: `int32`,
})
min_age: number  | null;
@ApiProperty({
  type: `number`,
  format: `double`,
})
base_price: Prisma.Decimal ;
@ApiProperty({
  type: `number`,
  format: `double`,
})
rating_avg: Prisma.Decimal ;
@ApiProperty({
  type: `string`,
  format: `date-time`,
})
created_at: Date ;
}
