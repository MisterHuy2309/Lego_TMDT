
import {Prisma} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'


export class ProductSkusDto {
  id: string ;
sku_code: string ;
box_condition: string  | null;
@ApiProperty({
  type: `number`,
  format: `double`,
})
price: Prisma.Decimal ;
@ApiProperty({
  type: `integer`,
  format: `int32`,
})
stock_quantity: number ;
}
