import { JwtUtil } from '../util/jwt.util';

export function wsAuthMiddleware(socket, next) {
  try {
    console.log('_____socket', socket);
    // Check multiple places where the token might be sent
    let authorization;

    // 1. Check auth object (from Socket.IO client auth option)
    if (socket.handshake.auth && socket.handshake.auth.token) {
      authorization = `Bearer ${socket.handshake.auth.token}`;
    }
    // 2. Check query parameters (alternative method)
    else if (socket.handshake.query && socket.handshake.query.token) {
      authorization = `Bearer ${socket.handshake.query.token}`;
    }
    // 3. Check headers (traditional method)
    else if (socket.handshake.headers.authorization) {
      authorization = socket.handshake.headers.authorization;
    }

    console.log('WebSocket auth - authorization:', authorization);

    if (!authorization) {
      throw new Error('No authorization token provided');
    }

    const payload = JwtUtil.isValidAuthHeader(authorization);

    // Store user info in socket for later use
    socket.handshake.user = payload;

    return next();
  } catch (error) {
    console.error('WebSocket auth error:', error.message);
    socket.emit('error', {
      message: 'Authentication failed',
      error: error.message,
    });
    return next(error);
  }
}
