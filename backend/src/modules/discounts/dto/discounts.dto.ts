import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

// 1. Enum loại giảm giá (Theo số tiền cố định hoặc Theo %)
export enum DiscountType {
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  PERCENTAGE = 'PERCENTAGE',
}

// ==========================================
// 2. DTO TẠO MỚI MÃ GIẢM GIÁ (ADMIN)
// ==========================================
export class CreateDiscountDto {
  @ApiProperty({ example: 'SUMMER2026', description: 'Mã giảm giá (In hoa, viết liền)' })
  @IsNotEmpty({ message: 'Mã giảm giá không được để trống' })
  @IsString()
  code!: string;

  @ApiPropertyOptional({ example: 'Giảm 10% tối đa 100k cho đơn từ 500k' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: DiscountType, example: DiscountType.PERCENTAGE })
  @IsEnum(DiscountType, { message: 'Loại giảm giá phải là FIXED_AMOUNT hoặc PERCENTAGE' })
  discount_type!: DiscountType;

  @ApiProperty({ example: 10, description: 'Giá trị giảm (Số tiền VND hoặc %)' })
  @IsNumber({}, { message: 'Giá trị giảm phải là số' })
  @Min(0, { message: 'Giá trị giảm không được âm' })
  discount_value!: number;

  @ApiPropertyOptional({ example: 500000, default: 0, description: 'Giá trị đơn tối thiểu để dùng mã' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  min_order_value?: number;

  @ApiPropertyOptional({ example: 100000, description: 'Số tiền giảm tối đa (Dành cho loại PERCENTAGE)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  max_discount?: number;

  @ApiPropertyOptional({ example: 100, description: 'Giới hạn tổng số lần sử dụng mã' })
  @IsOptional()
  @IsInt({ message: 'Số lượt sử dụng phải là số nguyên' })
  @Min(1)
  usage_limit?: number;

  @ApiProperty({ example: '2026-08-01T00:00:00.000Z' })
  @IsDateString({}, { message: 'Start date phải là chuỗi ISO Date' })
  start_date!: string;

  @ApiProperty({ example: '2026-08-31T23:59:59.000Z' })
  @IsDateString({}, { message: 'End date phải là chuỗi ISO Date' })
  end_date!: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

// Export Alias để tương thích với các generator sinh ra số nhiều
export { CreateDiscountDto as CreateDiscountsDto };

// ==========================================
// 3. DTO CẬP NHẬT MÃ GIẢM GIÁ (ADMIN)
// ==========================================
export class UpdateDiscountDto extends PartialType(CreateDiscountDto) {}
export { UpdateDiscountDto as UpdateDiscountsDto };

// ==========================================
// 4. DTO ÁP DỤNG / KIỂM TRA MÃ (CLIENT)
// ==========================================
export class ApplyDiscountDto {
  @ApiProperty({ example: 'SUMMER2026', description: 'Mã giảm giá khách hàng nhập' })
  @IsNotEmpty({ message: 'Vui lòng nhập mã giảm giá' })
  @IsString()
  code!: string;

  @ApiProperty({ example: 1500000, description: 'Tạm tính tiền hàng của đơn' })
  @IsNumber()
  @Min(0)
  order_subtotal!: number;
}