
import {ApiProperty} from '@nestjs/swagger'
import {AddressesEntity} from '../../addresses/entities/addresses.entity'
import {CartItemsEntity} from '../../cart-items/entities/cart-items.entity'
import {OrdersEntity} from '../../orders/entities/orders.entity'
import {ReviewsEntity} from '../../reviews/entities/reviews.entity'


export class UsersEntity {
  id: string ;
email: string ;
password_hash: string ;
full_name: string ;
phone: string  | null;
avatar_url: string  | null;
role: string ;
@ApiProperty({
  type: `string`,
  format: `date-time`,
})
created_at: Date ;
addresses?: AddressesEntity[] ;
cart_items?: CartItemsEntity[] ;
orders?: OrdersEntity[] ;
reviews?: ReviewsEntity[] ;
}
