
import {ApiProperty} from '@nestjs/swagger'


export class UsersDto {
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
}
