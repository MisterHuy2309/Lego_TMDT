import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { 
  IsArray, 
  IsBoolean, 
  IsNotEmpty, 
  IsNumber, 
  IsOptional, 
  IsString, 
  ValidateNested 
} from 'class-validator';

// 🟢 Class validate cho từng Ảnh
export class ProductImageDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  image_url!: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  is_primary?: boolean;
}

// 🟢 Class validate cho từng SKU / Tồn kho
export class ProductSkuDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sku_code!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  box_condition?: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  price!: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  stock_quantity!: number;
}

// 🟢 Class DTO Tạo Sản Phẩm
export class CreateProductDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  slug!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category_id?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  item_number?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  piece_count?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  min_age?: number;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  base_price!: number;

  // 🔴 THÊM 2 MẢNG NÀY ĐỂ NESTJS KHÔNG BÁO LỖI "SHOULD NOT EXIST"
  @ApiPropertyOptional({ type: [ProductImageDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images?: ProductImageDto[];

  @ApiPropertyOptional({ type: [ProductSkuDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProductSkuDto)
  skus?: ProductSkuDto[];
}