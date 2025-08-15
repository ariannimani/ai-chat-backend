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
    console.log({ username });

    // Step 1: Create user in Supabase Auth
    const supabaseResult = await this.supabaseAuthService.signUpWithSupabase(
      dto.email,
      dto.password,
      {
        name: dto.name || null,
        username: username,
      },
    );

    console.log({ supabaseResult });

    // // Step 2: Create user in local database with Supabase user ID
    // if (supabaseResult.user?.id) {
    //   try {
    //     const localUser = await this.usersService.createWithSupabaseId(
    //       supabaseResult.user.id,
    //       dto,
    //     );

    //     return {
    //       message: 'User registered successfully',
    //       data: {
    //         user: supabaseResult.user,
    //         localUser: localUser,
    //         access_token: supabaseResult.session?.access_token || null,
    //         refresh_token: supabaseResult.session?.refresh_token || null,
    //         session: supabaseResult.session,
    //         requiresEmailConfirmation: !supabaseResult.session,
    //       },
    //     };
    //   } catch (localDbError) {
    //     // If local DB creation fails, we should ideally clean up the Supabase user
    //     // For now, we'll log the error and still return success since Supabase user was created
    //     console.error('Failed to create local user:', localDbError);

    //     return {
    //       message: 'User registered in Supabase but local database sync failed',
    //       data: {
    //         user: supabaseResult.user,
    //         localUser: null,
    //         access_token: supabaseResult.session?.access_token || null,
    //         refresh_token: supabaseResult.session?.refresh_token || null,
    //         session: supabaseResult.session,
    //         requiresEmailConfirmation: !supabaseResult.session,
    //         warning: 'Local database sync failed - user may need manual sync',
    //       },
    //     };
    //   }
    // }

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
