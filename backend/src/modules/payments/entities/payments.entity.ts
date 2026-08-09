
import {ApiProperty} from '@nestjs/swagger'
import {OrdersEntity} from '../../orders/entities/orders.entity'


export class PaymentsEntity {
  id: string ;
order_id: string ;
provider: string ;
status: string ;
transaction_code: string  | null;
@ApiProperty({
  type: `string`,
  format: `date-time`,
})
paid_at: Date  | null;
order?: OrdersEntity ;
}
