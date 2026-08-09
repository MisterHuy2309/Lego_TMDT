
import {Prisma} from '@prisma/client'
import {ApiProperty} from '@nestjs/swagger'
import {PaymentsEntity} from '../../payments/entities/payments.entity'


export class RefundsEntity {
  id: string ;
payment_id: string ;
@ApiProperty({
  type: `number`,
  format: `double`,
})
amount: Prisma.Decimal ;
status: string ;
refund_code: string  | null;
reason: string  | null;
@ApiProperty({
  type: `string`,
  format: `date-time`,
})
created_at: Date ;
@ApiProperty({
  type: `string`,
  format: `date-time`,
})
completed_at: Date  | null;
payment?: PaymentsEntity ;
}
