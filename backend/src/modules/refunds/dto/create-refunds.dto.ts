
import {Prisma} from '@prisma/client'
import {ApiProperty,getSchemaPath} from '@nestjs/swagger'




export class CreateRefundsDto {
  @ApiProperty({
  type: `number`,
  format: `double`,
})
amount: Prisma.Decimal;
refund_code?: string;
reason?: string;
@ApiProperty({
  type: `string`,
  format: `date-time`,
})
completed_at?: Date;
}
