import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum PaymentProvider {
  COD = 'COD',
  VNPAY = 'VNPAY',
  ZALOPAY = 'ZALOPAY',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export class CreatePaymentUrlDto {
  @ApiProperty({ example: 'uuid-order-id', description: 'ID Đơn hàng cần thanh toán' })
  @IsNotEmpty({ message: 'Order ID không được để trống' })
  @IsString()
  order_id!: string;

  @ApiProperty({ enum: PaymentProvider, example: PaymentProvider.VNPAY })
  @IsEnum(PaymentProvider, { message: 'Provider phải là COD, VNPAY hoặc ZALOPAY' })
  provider!: PaymentProvider;
}

export class ProcessCodPaymentDto {
  @ApiProperty({ example: 'uuid-payment-id', description: 'ID của lượt thanh toán' })
  @IsNotEmpty()
  @IsString()
  payment_id!: string;
}

export class RefundPaymentDto {
  @ApiProperty({ example: 1500000, description: 'Số tiền hoàn trả' })
  @IsNumber()
  @Min(1000)
  amount!: number;

  @ApiPropertyOptional({ example: 'Khách hàng đổi trả sản phẩm lỗi' })
  @IsOptional()
  @IsString()
  reason?: string;
}