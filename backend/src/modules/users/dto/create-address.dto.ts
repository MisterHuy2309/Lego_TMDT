import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({ example: 'Châu Gia Huy' })
  @IsNotEmpty({ message: 'Tên người nhận không được để trống' })
  @IsString()
  recipient_name!: string;

  @ApiProperty({ example: '0912345678' })
  @IsNotEmpty({ message: 'Số điện thoại nhận hàng không được để trống' })
  @IsString()
  phone!: string;

  @ApiProperty({ example: '123 Đường Nguyễn Văn Cừ' })
  @IsNotEmpty({ message: 'Tên đường/Số nhà không được để trống' })
  @IsString()
  street!: string;

  @ApiPropertyOptional({ example: 'Phường Trấn Biên' })
  @IsOptional()
  @IsString()
  ward?: string;

  @ApiPropertyOptional({ example: 'TP. Biên Hòa' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiProperty({ example: 'Đồng Nai' })
  @IsNotEmpty({ message: 'Tỉnh/Thành phố không được để trống' })
  @IsString()
  city!: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}