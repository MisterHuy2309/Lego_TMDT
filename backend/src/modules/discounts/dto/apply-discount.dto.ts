import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class ApplyDiscountDto {
  @ApiProperty({ example: 'LEGO10K' })
  @IsNotEmpty({ message: 'Mã giảm giá không được để trống' })
  @IsString()
  code!: string;

  @ApiProperty({ example: 2000000, description: 'Tổng tiền hàng tạm tính' })
  @IsNumber()
  @Min(0)
  order_subtotal!: number;
}