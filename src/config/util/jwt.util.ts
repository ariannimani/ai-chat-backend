import * as jwt from 'jsonwebtoken';

export class JwtUtil {
  static isValidAuthHeader(authorization: string) {
    console.log('JWT validation - authorization:', authorization);

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

    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      ignoreExpiration: false,
    });

    return payload;
  }
}
