import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { SupabaseAuthService } from './supabase-auth.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabaseAuthService: SupabaseAuthService,
    private readonly usersService: UsersService,
  ) {}

  async login(dto: LoginAuthDto) {
    const result = await this.supabaseAuthService.signInWithSupabase(
      dto.email,
      dto.password,
    );

    return {
      message: 'User logged in successfully via Supabase',
      data: {
        user: result.user,
        access_token: result.session?.access_token || null,
        refresh_token: result.session?.refresh_token || null,
        session: result.session,
        requiresEmailConfirmation: !result.session,
      },
    };
  }

  async register(dto: RegisterAuthDto) {
    // Generate username if not provided
    const username = dto.username || this.generateUniqueUsername();

    // Step 1: Create user in Supabase Auth
    const supabaseResult = await this.supabaseAuthService.signUpWithSupabase(
      dto.email,
      dto.password,
      {
        name: dto.name || null,
        username: username,
      },
    );

    return {
      message: 'User registered successfully via Supabase',
      data: {
        user: supabaseResult.user,
        access_token: supabaseResult.session?.access_token || null,
        refresh_token: supabaseResult.session?.refresh_token || null,
        session: supabaseResult.session,
        requiresEmailConfirmation: !supabaseResult.session,
      },
    };
  }

  async signOut() {
    return await this.supabaseAuthService.signOut();
  }

  private generateUniqueUsername(): string {
    // Generate a random username using a simple algorithm
    const adjectives = [
      'brave',
      'clever',
      'happy',
      'swift',
      'bright',
      'kind',
      'bold',
    ];
    const nouns = ['tiger', 'eagle', 'wolf', 'fox', 'bear', 'lion', 'hawk'];
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 9999) + 1;

    return `${adjective}_${noun}_${number}`;
  }
}
