import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy, 'supabase') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.SUPABASE_JWT_SECRET,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: any) {
    if (!payload) {
      throw new UnauthorizedException('No payload in token');
    }

    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token: missing subject');
    }

    const user = {
      id: payload.sub,
      email: payload.email,
      aud: payload.aud,
      role: payload.role || 'authenticated',
      ...payload,
    };

    return user;
  }
}
