
import {ApiProperty} from '@nestjs/swagger'
import {UsersEntity} from '../../users/entities/users.entity'
import {ProductSkusEntity} from '../../product-skus/entities/product-skus.entity'


export class CartItemsEntity {
  id: string ;
user_id: string ;
sku_id: string ;
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
user?: UsersEntity ;
sku?: ProductSkusEntity ;
}
