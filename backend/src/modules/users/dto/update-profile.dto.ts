import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Châu Gia Huy' })
  @IsOptional()
  @IsString()
  full_name?: string;

  @ApiPropertyOptional({ example: 'huy@gmail.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email?: string;

  @ApiPropertyOptional({ example: '0912345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '/uploads/avatars/avatar-123.jpg' })
  @IsOptional()
  @IsString()
  avatar_url?: string;

  // 🟢 Bổ sung các trường địa chỉ để nhận từ Frontend
  @ApiPropertyOptional({ example: '123 Đường Nguyễn Văn Cừ' })
  @IsOptional()
  @IsString()
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