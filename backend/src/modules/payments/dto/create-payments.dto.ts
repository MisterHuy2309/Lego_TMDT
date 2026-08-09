
import {ApiProperty,getSchemaPath} from '@nestjs/swagger'




export class CreatePaymentsDto {
  provider: string;
transaction_code?: string;
@ApiProperty({
  type: `string`,
  format: `date-time`,
})
paid_at?: Date;
}
