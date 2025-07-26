import { Injectable } from '@nestjs/common';
import { LoginAuthDto } from './dto/login-auth.dto';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { SupabaseAuthService } from './supabase-auth.service';

@Injectable()
export class AuthService {
  constructor(private readonly supabaseAuthService: SupabaseAuthService) {}

  async login(dto: LoginAuthDto) {
    const result = await this.supabaseAuthService.signInWithSupabase(
      dto.email,
      dto.password,
    );

    return {
      message: 'User logged in successfully via Supabase',
      data: result,
    };
  }

  async register(dto: RegisterAuthDto) {
    const result = await this.supabaseAuthService.signUpWithSupabase(
      dto.email,
      dto.password,
      {
        name: dto.name,
        // Add any other metadata from the DTO
      },
    );

    return {
      message: 'User registered successfully via Supabase',
      data: result,
    };
  }

  async signOut() {
    return await this.supabaseAuthService.signOut();
  }
}
