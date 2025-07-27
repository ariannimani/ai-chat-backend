import {
  ExecutionContext,
  Injectable,
  CanActivate,
  Inject,
  Optional,
  Logger,
} from '@nestjs/common';
import { SupabaseClient, User, createClient } from '@supabase/supabase-js';

@Injectable()
export class WsSupabaseAuthGuard implements CanActivate {
  supabaseClient;
  private readonly logger = new Logger(WsSupabaseAuthGuard.name);

  constructor(@Optional() @Inject('SUPABASE_CLIENT') client?: SupabaseClient) {
    this.supabaseClient = client || this.initializeSupabaseClient();
  }

  private initializeSupabaseClient(): SupabaseClient {
    this.logger.debug(
      'WebSocket Supabase auth guard initializing new Supabase client.',
    );
    if (!process.env.SUPABASE_URL) {
      throw new Error(
        'Supabase Auth environment variable: SUPABASE_URL is not set.',
      );
    }
    if (!process.env.SUPABASE_ANON_KEY) {
      throw new Error(
        'Supabase Auth environment variable: SUPABASE_ANON_KEY is not set.',
      );
    }

    return createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client = context.switchToWs().getClient();
      const handshake = client.handshake;

      const token = this.extractTokenFromHandshake(handshake);
      if (!token) {
        this.logger.error(
          'WsSupabaseAuthGuard: No authorization token provided',
        );
        return false;
      }

      const user = await this.getUserFromJWT(token);
      if (!user) {
        this.logger.error('WsSupabaseAuthGuard: Invalid token');
        return false;
      }

      // Store user info in handshake for later use
      handshake.user = user;

      return true;
    } catch (error) {
      this.logger.error(
        'WsSupabaseAuthGuard: Authentication failed',
        error.message,
      );
      return false;
    }
  }

  private extractTokenFromHandshake(handshake: any): string | undefined {
    // Check multiple places where the token might be sent
    let token: string | undefined;

    // 1. Check auth object (from Socket.IO client auth option)
    if (handshake.auth && handshake.auth.token) {
      token = handshake.auth.token;
    }
    // 2. Check query parameters
    else if (handshake.query && handshake.query.token) {
      token = handshake.query.token;
    }
    // 3. Check headers (Bearer format)
    else if (handshake.headers.authorization) {
      const [type, bearerToken] =
        handshake.headers.authorization.split(' ') ?? [];
      if (type === 'Bearer' && bearerToken && bearerToken !== 'undefined') {
        token = bearerToken;
      }
    }

    return token;
  }

  async getUserFromJWT(token: string): Promise<User | undefined> {
    const response = await this.supabaseClient.auth.getUser(token);
    if (!response.data.user) {
      return undefined;
    }
    return response.data.user;
  }
}
