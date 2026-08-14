import { PartialType } from '@nestjs/mapped-types';
import { CreateAdminsetingDto } from './create-adminseting.dto';

export class UpdateAdminsetingDto extends PartialType(CreateAdminsetingDto) {}
