import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
export class CreateAddressDto {
  @ApiProperty({ example: 'address_id' })
  id!: string ;

  @ApiProperty({ example: 'Châu Gia Huy' })
  recipient_name!: string ;

  @ApiProperty({ example: '0912345678' })
  phone!: string ;

  @ApiProperty({ example: '123 Đường Nguyễn Văn Cừ' })
  street!: string ;

  @ApiPropertyOptional({ example: 'Phường Trấn Biên' })
  ward!: string  | null;
district!: string  | null;
city!: string ;
is_default!: boolean ;
}
