import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

// DTO Cài đặt / Đổi mã PIN
export class SetPinDto {
  @ApiProperty({ description: 'Mật khẩu đăng nhập Admin hiện tại' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu đăng nhập để xác thực!' })
  password!: string;

  @ApiProperty({ description: 'Mã PIN 6 chữ số' })
  @IsString()
  @Length(6, 6, { message: 'Mã PIN phải bao gồm chính xác 6 chữ số!' })
  @Matches(/^[0-9]+$/, { message: 'Mã PIN chỉ bao gồm các chữ số 0-9!' })
  pin!: string;
}

// DTO Thực hiện Reset Doanh Thu
export class ResetRevenueDto {
  @ApiProperty({ description: 'Mã PIN 6 chữ số để thực hiện Reset' })
  @IsString()
  @Length(6, 6, { message: 'Mã PIN phải đủ 6 chữ số!' })
  pin!: string;
}