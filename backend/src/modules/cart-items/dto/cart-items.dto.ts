
import {ApiProperty} from '@nestjs/swagger'


export class CartItemsDto {
  id: string ;
@ApiProperty({
  type: `integer`,
  format: `int32`,
})
quantity: number ;
@ApiProperty({
  type: `string`,
  format: `date-time`,
})
updated_at: Date ;
}
