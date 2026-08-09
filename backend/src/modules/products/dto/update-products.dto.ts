
import {Prisma} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'




export class UpdateProductsDto {
  name?: string;
slug?: string;
description?: string;
item_number?: string;
@ApiProperty({
  type: `integer`,
  format: `int32`,
})
piece_count?: number;
@ApiProperty({
  type: `integer`,
  format: `int32`,
})
min_age?: number;
@ApiProperty({
  type: `number`,
  format: `double`,
})
base_price?: Prisma.Decimal;
}
