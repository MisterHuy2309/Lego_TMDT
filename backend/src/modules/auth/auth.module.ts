import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport'; // 👈 Thêm
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy'; // 👈 Thêm

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }), // 👈 Thêm
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'lego_shop_secret_key',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy], // 👈 Thêm JwtStrategy
  exports: [AuthService],
})
export class AuthModule {}