import { ExecutionContext, Injectable, CanActivate } from '@nestjs/common';
import { JwtUtil } from '../util/jwt.util';

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
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
        console.error('WsJwtAuthGuard: No authorization token provided');
        return false;
      }

      const payload = JwtUtil.isValidAuthHeader(authorization);

      // Store user info in handshake for later use
      handshake.user = payload;

      console.log(
        'WsJwtAuthGuard: Authentication successful for user',
        payload.sub,
      );
      return true;
    } catch (error) {
      console.error('WsJwtAuthGuard: Authentication failed', error.message);
      return false;
    }
  }
}
