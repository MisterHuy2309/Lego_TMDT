
import {Prisma} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'
import {ProductsEntity} from '../../products/entities/products.entity'
import {CartItemsEntity} from '../../cart-items/entities/cart-items.entity'
import { OrdersEntity } from 'src/modules/orders/entities/orders.entity';
export class ProductSkusEntity {
  id!: string ;
product_id!: string ;
sku_code!: string ;
box_condition!: string  | null;
@ApiProperty({
  type: `number`,
  format: `double`,
})
price!: Prisma.Decimal ;
@ApiProperty({
  type: `integer`,
  format: `int32`,
})
stock_quantity!: number ;
product?: ProductsEntity ;
cart_items?: CartItemsEntity[] ;
order_items?: OrdersEntity[] ;
}
