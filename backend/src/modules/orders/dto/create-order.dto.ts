import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum PaymentMethod {
  COD = 'COD',
  VNPAY = 'VNPAY',
  ZALOPAY = 'ZALOPAY',
}

export class CreateOrderDto {
  @ApiPropertyOptional({
    example: '32c8261f-8acc-4809-b0aa-a2d559e7d61f',
    description: 'ID địa chỉ giao hàng (Nếu bỏ trống, hệ thống tự động lấy địa chỉ mặc định của user)',
  })
  @IsOptional()
  @IsString()
  address_id?: string;

  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.COD,
    description: 'Phương thức thanh toán',
  })
  @IsNotEmpty({ message: 'Phương thức thanh toán không được để trống' })
  @IsEnum(PaymentMethod, { message: 'Phương thức thanh toán không hợp lệ' })
  payment_method!: PaymentMethod;

  @ApiPropertyOptional({ example: 'LEGO2026', description: 'Mã giảm giá (nếu có)' })
  @IsOptional()
  @IsString()
  discount_code?: string;

  @ApiPropertyOptional({ example: 'Giao giờ hành chính', description: 'Ghi chú đơn hàng' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: ['PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELLED'],
    example: 'CONFIRMED',
    description: 'Trạng thái mới của đơn hàng',
  })
  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  @IsEnum(['PENDING', 'CONFIRMED', 'DELIVERED', 'CANCELLED'], {
    message: 'Trạng thái đơn hàng không hợp lệ',
  })
  status!: 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';
}