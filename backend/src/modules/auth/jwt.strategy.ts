import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'lego_shop_secret_key',
    });
  }

  async validate(payload: any) {
    // Giá trị trả về ở đây sẽ được gán trực tiếp vào req.user
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}