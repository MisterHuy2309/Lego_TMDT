
import {ApiProperty} from '@nestjs/swagger'




export class UpdateReviewsDto {
  @ApiProperty({
  type: `integer`,
  format: `int32`,
})
rating?: number;
comment?: string;
}
