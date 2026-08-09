import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@gmail.com' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email!: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải từ 6 ký tự' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  password!: string;

  @ApiProperty({ example: 'Châu Gia Huy' })
  @IsString()
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  full_name!: string;

  @ApiProperty({ example: '0912345678' })
  @IsString()
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  phone!: string;

  // 🟢 BỎ BẮT BUỘC KHỎI STREET & CITY - ĐỔI TẤT CẢ THÀNH @IsOptional()
  @ApiPropertyOptional({ example: '123 Đường Nguyễn Văn Cừ' })
  @IsOptional()
  @IsString({ message: 'street phải là chuỗi ký tự' })
  street?: string;

  @ApiPropertyOptional({ example: 'Phường Trấn Biên' })
  @IsOptional()
  @IsString()
  ward?: string;

  @ApiPropertyOptional({ example: 'TP. Biên Hòa' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ example: 'Đồng Nai' })
  @IsOptional()
  @IsString()
  city?: string;
}