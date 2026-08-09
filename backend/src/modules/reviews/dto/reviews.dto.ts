import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

// 1. DTO tạo Đánh giá mới
export class CreateReviewDto {
  @ApiProperty({ example: 'uuid-product-id', description: 'ID sản phẩm đánh giá' })
  @IsNotEmpty({ message: 'Product ID không được để trống' })
  @IsString()
  product_id!: string;

  @ApiProperty({ example: 'uuid-order-item-id', description: 'ID sản phẩm trong đơn hàng đã mua' })
  @IsNotEmpty({ message: 'Order Item ID không được để trống' })
  @IsString()
  order_item_id!: string;

  @ApiProperty({ example: 5, description: 'Số sao đánh giá (từ 1 đến 5)' })
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt({ message: 'Rating phải là số nguyên' })
  @Min(1, { message: 'Đánh giá tối thiểu là 1 sao' })
  @Max(5, { message: 'Đánh giá tối đa là 5 sao' })
  rating!: number;

  @ApiPropertyOptional({ example: 'Bộ Lego rất đẹp, đóng gói chắc chắn!', description: 'Nội dung bình luận' })
  @IsOptional()
  @IsString()
  comment?: string;
}

// 2. DTO Lọc danh sách Đánh giá
export class QueryReviewDto {
  @ApiPropertyOptional({ example: 5, description: 'Lọc theo số sao (1-5)' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  limit?: number = 10;

}

export class UpdateReviewDto {
  @ApiPropertyOptional({ example: 4, description: 'Sửa số sao đánh giá (1-5)' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ example: 'Sản phẩm dùng tốt, nhưng giao hàng hơi chậm chút.', description: 'Sửa nội dung' })
  @IsOptional()
  @IsString()
  comment?: string;
}