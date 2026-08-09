import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoriesDto {
  @ApiProperty({ example: 'Lego Star Wars' })
  @IsNotEmpty({ message: 'Tên danh mục không được để trống' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'lego-star-wars' })
  @IsNotEmpty({ message: 'Slug không được để trống' })
  @IsString()
  slug!: string;

  @ApiPropertyOptional({ example: 'uuid-parent-id', description: 'ID danh mục cha (nếu có)' })
  @IsOptional()
  @IsString()
  parent_id?: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  @IsOptional()
  @IsString()
  image_url?: string;
}