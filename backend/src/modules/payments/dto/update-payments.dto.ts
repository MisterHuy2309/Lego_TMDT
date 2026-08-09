
import {ApiProperty} from '@nestjs/swagger'




export class UpdatePaymentsDto {
  provider?: string;
transaction_code?: string;
@ApiProperty({
  type: `string`,
  format: `date-time`,
})
paid_at?: Date;
}
