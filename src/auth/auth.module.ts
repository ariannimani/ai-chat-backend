import * as dotenv from 'dotenv';

import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SupabaseStrategy } from './strategies/supabase.strategy';
import { SupabaseAuthService } from './supabase-auth.service';

dotenv.config();

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService, SupabaseStrategy, SupabaseAuthService],
  exports: [AuthService, SupabaseAuthService],
})
export class AuthModule {}
