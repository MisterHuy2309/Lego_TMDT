import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'PasswordOld123!' })
  @IsNotEmpty({ message: 'Mật khẩu cũ không được để trống' })
  @IsString()
  old_password!: string;

  @ApiProperty({ example: 'PasswordNew123!' })
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
  new_password!: string;
}