import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {IsBoolean,IsDateString,IsEnum,IsInt,IsNotEmpty,IsNumber, IsOptional,IsString,Min} from 'class-validator';

export enum DiscountType {
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  PERCENTAGE = 'PERCENTAGE',
}

export class ApplyDiscountDto {
  @ApiProperty({ example: 'SUMMER2026', description: 'Mã giảm giá nhập vào' })
  @IsNotEmpty({ message: 'Vui lòng nhập mã giảm giá' })
  @IsString()
  code!: string;

  @ApiProperty({ example: 1500000, description: 'Tổng tiền hàng tạm tính' })
  @IsNumber()
  @Min(0)
  order_subtotal!: number;
}

export class CreateDiscountsDto {
  @ApiProperty({ example: 'SUMMER2026' })
  @IsNotEmpty({ message: 'Mã giảm giá không được để trống' })
  @IsString()
  code!: string;

  @ApiPropertyOptional({ example: 'Giảm 10% tối đa 100k' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: DiscountType, example: DiscountType.PERCENTAGE })
  @IsEnum(DiscountType, { message: 'Loại giảm giá phải là FIXED_AMOUNT hoặc PERCENTAGE' })
  discount_type!: DiscountType;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0)
  discount_value!: number;

  @ApiPropertyOptional({ example: 500000, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  min_order_value?: number;

  @ApiPropertyOptional({ example: 100000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  max_discount?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  usage_limit?: number;

  @ApiProperty({ example: '2026-08-01T00:00:00.000Z' })
  @IsDateString()
  start_date!: string;

  @ApiProperty({ example: '2026-08-31T23:59:59.000Z' })
  @IsDateString()
  end_date!: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

// Export Alias để fix triệt để lỗi TS2724
export { CreateDiscountsDto as CreateDiscountDto };