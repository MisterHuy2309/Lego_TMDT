import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class AddToCartDto {
  @ApiProperty({ example: 'uuid-sku-id', description: 'ID của biến thể Lego (SKU)' })
  @IsNotEmpty({ message: 'SKU ID không được để trống' })
  @IsString()
  sku_id!: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsNotEmpty()
  @IsInt()
  @Min(1, { message: 'Số lượng phải lớn hơn 0' })
  quantity!: number;
}