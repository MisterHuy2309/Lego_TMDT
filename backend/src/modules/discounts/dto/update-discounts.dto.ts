
import {Prisma} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'




export class UpdateDiscountsDto {
  code?: string;
description?: string;
discount_type?: string;
@ApiProperty({
  type: `number`,
  format: `double`,
})
discount_value?: Prisma.Decimal;
@ApiProperty({
  type: `number`,
  format: `double`,
})
max_discount?: Prisma.Decimal;
@ApiProperty({
  type: `integer`,
  format: `int32`,
})
usage_limit?: number;
@ApiProperty({
  type: `string`,
  format: `date-time`,
})
start_date?: Date;
@ApiProperty({
  type: `string`,
  format: `date-time`,
})
end_date?: Date;
}
