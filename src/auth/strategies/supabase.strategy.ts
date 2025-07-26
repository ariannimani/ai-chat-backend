import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy, 'supabase') {
  constructor() {
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    
    if (!jwtSecret) {
      console.error('SUPABASE_JWT_SECRET is not defined!');
      throw new Error('SUPABASE_JWT_SECRET environment variable is required');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: any) {
    if (!payload) {
      console.log('SupabaseStrategy - No payload received');
      throw new UnauthorizedException('No payload in token');
    }

    if (!payload.sub) {
      console.log('SupabaseStrategy - No sub field in payload');
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
