import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/create-auth.dto';
import { LoginDto } from './dto/update-auth.dto';

@ApiTags('Auth (Xác thực & Đăng ký/Đăng nhập)')
@Controller('auth') // 🟢 ĐỔI TỪ 'api/v1/auth' THÀNH 'auth'
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản mới (Bắt buộc kèm địa chỉ nhận hàng)' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập vào hệ thống' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}