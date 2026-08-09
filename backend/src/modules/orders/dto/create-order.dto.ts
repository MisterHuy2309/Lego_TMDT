import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({ example: 'uuid-address-id' })
  @IsNotEmpty({ message: 'Địa chỉ nhận hàng không được để trống' })
  @IsString()
  address_id!: string;

  @ApiProperty({ example: 'COD', description: 'COD, VNPAY, ZALOPAY' })
  @IsNotEmpty()
  @IsString()
  payment_method!: string;

  @ApiProperty({ example: 'SUMMER2026', required: false })
  @IsOptional()
  @IsString()
  discount_code?: string;
}