import { ExecutionContext, Injectable, CanActivate } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class WsSupabaseAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    try {
      const client = context.switchToWs().getClient();
      const handshake = client.handshake;

      // Check multiple places where the token might be sent
      let authorization;

      // 1. Check auth object (from Socket.IO client auth option)
      if (handshake.auth && handshake.auth.token) {
        authorization = `Bearer ${handshake.auth.token}`;
      }
      // 2. Check query parameters
      else if (handshake.query && handshake.query.token) {
        authorization = `Bearer ${handshake.query.token}`;
      }
      // 3. Check headers
      else if (handshake.headers.authorization) {
        authorization = handshake.headers.authorization;
      }

      if (!authorization) {
        console.error('WsSupabaseAuthGuard: No authorization token provided');
        return false;
      }

      const payload = this.validateSupabaseJWT(authorization);

      // Store user info in handshake for later use
      handshake.user = payload;

      return true;
    } catch (error) {
      console.error(
        'WsSupabaseAuthGuard: Authentication failed',
        error.message,
      );
      return false;
    }
  }

  private validateSupabaseJWT(authorization: string) {
    if (!authorization) {
      throw new Error('No authorization header provided');
    }

    if (typeof authorization !== 'string') {
      throw new Error('Authorization header must be a string');
    }

    const parts = authorization.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new Error(
        'Invalid authorization header format. Expected: Bearer <token>',
      );
    }

    const token = parts[1];
    if (!token) {
      throw new Error('No token provided in authorization header');
    }

    const payload = jwt.verify(token, process.env.SUPABASE_JWT_SECRET, {
      ignoreExpiration: false,
    });

    return payload;
  }
}
