
import {Prisma} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'




export class UpdateProductSkusDto {
  sku_code?: string;
box_condition?: string;
@ApiProperty({
  type: `number`,
  format: `double`,
})
price?: Prisma.Decimal;
}
