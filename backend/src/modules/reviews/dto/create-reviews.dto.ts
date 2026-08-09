
import {ApiProperty,getSchemaPath} from '@nestjs/swagger'




export class CreateReviewsDto {
  @ApiProperty({
  type: `integer`,
  format: `int32`,
})
rating!: number;
comment?: string;
}
