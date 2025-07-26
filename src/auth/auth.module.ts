import * as dotenv from 'dotenv';

import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SupabaseStrategy } from './strategies/supabase.strategy';
import { SupabaseAuthService } from './supabase-auth.service';

dotenv.config();

@Module({
  imports: [],
  controllers: [AuthController],
  providers: [AuthService, SupabaseStrategy, SupabaseAuthService],
  exports: [AuthService, SupabaseAuthService],
})
export class AuthModule {}
