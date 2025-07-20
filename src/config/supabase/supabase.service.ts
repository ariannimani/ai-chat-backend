import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      this.logger.warn(
        'Supabase URL or Anon Key not found. Supabase client will not be initialized.',
      );
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });

    this.logger.log('Supabase client initialized successfully');
  }

  getClient(): SupabaseClient {
    if (!this.supabase) {
      throw new Error(
        'Supabase client is not initialized. Please check your environment variables.',
      );
    }
    return this.supabase;
  }

  // Helper method for real-time subscriptions
  createRealtimeChannel(channelName: string) {
    return this.getClient().channel(channelName);
  }

  // Helper method for storage operations
  getStorage() {
    return this.getClient().storage;
  }

  // Helper method for auth operations (if you want to use Supabase auth)
  getAuth() {
    return this.getClient().auth;
  }

  // Helper method for database operations (alternative to TypeORM for simple queries)
  getDatabase() {
    return this.getClient().from.bind(this.getClient());
  }
}
