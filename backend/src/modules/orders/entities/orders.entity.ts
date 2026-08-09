
import {Prisma} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'
import {UsersEntity} from '../../users/entities/users.entity'
import {AddressesEntity} from '../../addresses/entities/addresses.entity'
import {DiscountsEntity} from '../../discounts/entities/discounts.entity'
//import { OrdersEntity } from 'src/modules/orders/entities/orders.entity';
import {PaymentsEntity} from '../../payments/entities/payments.entity'


export class OrdersEntity {
  id!: string ;
user_id!: string ;
address_id!: string ;
discount_id!: string  | null;
order_code!: string ;
status!: string ;
@ApiProperty({
  type: `number`,
  format: `double`,
})
total_amount!: Prisma.Decimal ;
@ApiProperty({
  type: `number`,
  format: `double`,
})
discount_amount!: Prisma.Decimal ;
@ApiProperty({
  type: `number`,
  format: `double`,
})
shipping_fee!: Prisma.Decimal ;
payment_method!: string ;
@ApiProperty({
  type: `string`,
  format: `date-time`,
})
created_at!: Date ;
user?: UsersEntity ;
address?: AddressesEntity ;
discount?: DiscountsEntity  | null;
order_items?: OrdersEntity[] ;
payments?: PaymentsEntity[] ;
}
