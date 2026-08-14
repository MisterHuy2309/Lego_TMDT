import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import * as fs from 'fs';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { Roles, RolesGuard } from '../auth/roles.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UploadAvatarDto } from './dto/upload-avatar.dto';
import { UsersService } from './users.service';

@ApiTags('Users & Profile (Tài khoản, Địa chỉ & Quản lý Khách hàng)')
@Controller(['api/v1/users', 'users']) // 🟢 BẮT CẢ 2 ĐƯỜNG DẪN DÙ DÙNG PREFIX HAY KHÔNG
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 👤 PROFILE
  @Get('profile')
  @ApiOperation({ summary: 'Xem thông tin tài khoản cá nhân & địa chỉ duy nhất' })
  getProfile(@Request() req: any) {
    const userId = req.user.id || req.user.sub;
    return this.usersService.getProfile(userId);
  }

  // 🟢 Hỗ trợ cả PATCH lẫn PUT
  @Patch('profile')
  @Put('profile')
  @ApiOperation({ summary: 'Cập nhật thông tin cá nhân & Địa chỉ nhận hàng' })
  updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    const userId = req.user.id || req.user.sub;
    return this.usersService.updateProfile(userId, dto);
  }

  // 🖼️ UPLOAD AVATAR
  @Patch('profile/avatar')
  @Put('profile/avatar')
  @ApiOperation({ summary: 'Tải lên ảnh đại diện trực tiếp từ thư viện thiết bị' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadAvatarDto })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/avatars';
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `avatar-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(
            new BadRequestException('Chấp nhận định dạng ảnh: JPG, JPEG, PNG, GIF, WEBP'),
            false,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadAvatar(@Request() req: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn một file ảnh từ thư viện!');
    }

    const userId = req.user.id || req.user.sub;
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    return this.usersService.uploadAvatar(userId, avatarUrl);
  }

  @Post('change-password')
  @ApiOperation({ summary: 'Đổi mật khẩu tài khoản cá nhân' })
  changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    const userId = req.user.id || req.user.sub;
    return this.usersService.changePassword(userId, dto);
  }

  // 🏠 ADDRESS
  @Get('address')
  @ApiOperation({ summary: 'Lấy thông tin địa chỉ nhận hàng của tôi' })
  getMyAddress(@Request() req: any) {
    const userId = req.user.id || req.user.sub;
    return this.usersService.getMyAddress(userId);
  }

  @Put('address')
  @ApiOperation({ summary: 'Chỉnh sửa / Cập nhật địa chỉ nhận hàng duy nhất' })
  updateAddress(@Request() req: any, @Body() dto: UpdateAddressDto) {
    const userId = req.user.id || req.user.sub;
    return this.usersService.updateAddress(userId, dto);
  }

  // 👥 ADMIN
  @Get('admin/customers')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[ADMIN] Lấy danh sách tất cả khách hàng (Có tìm kiếm)' })
  findAllCustomers(@Query() query: QueryCustomerDto) {
    return this.usersService.findAllCustomers(query);
  }

  @Get('admin/customers/:id/analytics')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[ADMIN] Xem chi tiết khách hàng' })
  getCustomerAnalytics(@Param('id') id: string) {
    return this.usersService.getCustomerAnalytics(id);
  }

  @Delete('admin/customers/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[ADMIN] Xóa khách hàng' })
  deleteCustomer(@Param('id') id: string) {
    return this.usersService.deleteCustomer(id);
  }
}