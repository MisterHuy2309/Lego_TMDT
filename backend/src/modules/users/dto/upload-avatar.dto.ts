import { ApiProperty } from '@nestjs/swagger';

export class UploadAvatarDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'File ảnh đại diện (jpg, jpeg, png)' })
  file: any;
}