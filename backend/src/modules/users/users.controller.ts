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
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
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
@Controller(['api/v1/users', 'users'])
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ============================================================================
  // 👤 PROFILE & TÀI KHOẢN
  // ============================================================================

  @Get('profile')
  @ApiOperation({ summary: 'Xem thông tin tài khoản cá nhân & địa chỉ duy nhất' })
  getProfile(@Request() req: any) {
    const userId = req.user.id || req.user.sub;
    return this.usersService.getProfile(userId);
  }

  @Patch('profile')
  @Put('profile')
  @ApiOperation({ summary: 'Cập nhật thông tin cá nhân & Địa chỉ nhận hàng' })
  updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    const userId = req.user.id || req.user.sub;
    return this.usersService.updateProfile(userId, dto);
  }

  @Patch('profile/avatar')
  @Put('profile/avatar')
  @ApiOperation({ summary: 'Tải lên ảnh đại diện trực tiếp từ thiết bị' })
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

  // ============================================================================
  // 🏠 ĐỊA CHỈ NHẬN HÀNG
  // ============================================================================

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

  // ============================================================================
  // 👥 [ADMIN] QUẢN LÝ KHÁCH HÀNG & TẶNG VOUCHER
  // ============================================================================

  @Get('admin/customers')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[ADMIN] Lấy danh sách tất cả khách hàng (Có tìm kiếm)' })
  findAllCustomers(@Query() query: QueryCustomerDto) {
    return this.usersService.findAllCustomers(query);
  }

  @Get('admin/customers-status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({
    summary: '[ADMIN] Lấy danh sách khách hàng (Online/Offline, Tin nhắn gần nhất, Địa chỉ)',
  })
  getCustomersWithStatus() {
    return this.usersService.getCustomersWithStatus();
  }

  @Post('admin/gift-voucher')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[ADMIN] Tặng mã giảm giá riêng cho khách hàng' })
  giftVoucherToUser(@Body() body: { user_id: string; discount_id: string }) {
    return this.usersService.giftVoucherToUser(body.user_id, body.discount_id);
  }

  @Get('admin/customers/:id/analytics')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[ADMIN] Xem chi tiết phân tích khách hàng' })
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

  // ============================================================================
  // 💬 [ADMIN] CHAT MESSENGER REALTIME (TEXT, MEDIA, SỬA, XÓA 2 CHIỀU)
  // ============================================================================

  @Get('admin/chat/:userId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[ADMIN] Lấy lịch sử tin nhắn Messenger với khách hàng' })
  getCustomerChatMessages(@Param('userId') userId: string) {
    return this.usersService.getCustomerChatMessages(userId);
  }

  @Post('admin/chat/:userId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[ADMIN] Gửi tin nhắn văn bản cho khách hàng' })
  adminSendMessage(
    @Request() req: any,
    @Param('userId') customerId: string,
    @Body() body: { message: string },
  ) {
    const adminId = req.user.id || req.user.sub;
    return this.usersService.adminSendMessage(adminId, customerId, body.message);
  }

  @Post('admin/chat/:userId/media')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[ADMIN] Gửi ảnh hoặc video trong cuộc trò chuyện' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/chat';
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `chat-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|mp4|webm|quicktime)$/)) {
          return cb(
            new BadRequestException(
              'Chấp nhận định dạng file hình ảnh (JPG, PNG, WEBP, GIF) hoặc video (MP4, WEBM, MOV)',
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  adminSendMediaMessage(
    @Request() req: any,
    @Param('userId') customerId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { message?: string },
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng đính kèm một file ảnh hoặc video!');
    }

    const adminId = req.user.id || req.user.sub;
    const mediaUrl = `/uploads/chat/${file.filename}`;
    const mediaType = file.mimetype.startsWith('video') ? 'VIDEO' : 'IMAGE';

    return this.usersService.adminSendMediaMessage(
      adminId,
      customerId,
      body.message,
      mediaUrl,
      mediaType,
    );
  }

  @Patch('admin/chat/message/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[ADMIN] Chỉnh sửa nội dung tin nhắn đã gửi' })
  editMessage(@Param('id') id: string, @Body() body: { message: string }) {
    if (!body.message || body.message.trim() === '') {
      throw new BadRequestException('Nội dung tin nhắn không được để trống!');
    }
    return this.usersService.editMessage(id, body.message);
  }

  @Delete('admin/chat/message/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: '[ADMIN] Xóa tin nhắn (Xóa phía tôi hoặc Thu hồi cả 2 phía)' })
  @ApiQuery({ name: 'type', enum: ['ME', 'ALL'], required: false })
  deleteMessage(
    @Param('id') id: string,
    @Request() req: any,
    @Query('type') type?: 'ME' | 'ALL',
  ) {
    const adminId = req.user.id || req.user.sub;
    return this.usersService.deleteMessage(id, adminId, type || 'ME');
  }
}