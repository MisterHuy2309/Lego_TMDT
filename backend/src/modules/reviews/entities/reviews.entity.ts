
import {ApiProperty} from '@nestjs/swagger'
import {UsersEntity} from '../../users/entities/users.entity'
import {ProductsEntity} from '../../products/entities/products.entity'
import { OrdersEntity } from 'src/modules/orders/entities/orders.entity';
//import { OrderItemsEntity } from '../../orders/entities/order-items.entity';
export class ReviewsEntity {
  id!: string ;
user_id!: string ;
product_id!: string ;
order_item_id!: string ;
@ApiProperty({
  type: `integer`,
  format: `int32`,
})
rating!: number ;
comment!: string  | null;
@ApiProperty({
  type: `string`,
  format: `date-time`,
})
created_at!: Date ;
user?: UsersEntity ;
product?: ProductsEntity ;
order_item?: OrdersEntity ;
}
