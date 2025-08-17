import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Public } from 'src/config/guard/public.decorator';
import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { RegisterAuthDto } from './dto/register-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  login(@Body() dto: LoginAuthDto) {
    try {
      return this.authService.login(dto);
    } catch (error) {
      if (error.message.includes('Invalid credentials')) {
        throw new HttpException(
          {
            statusCode: HttpStatus.UNAUTHORIZED,
            message: error.message,
            error: 'Unauthorized',
          },
          HttpStatus.UNAUTHORIZED,
        );
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: error.message,
          error: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('register')
  @Public()
  async register(@Body() dto: RegisterAuthDto) {
    try {
      return await this.authService.register(dto);
    } catch (error) {
      if (error.message.includes('Rate limit exceeded')) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: error.message,
            error: 'Too Many Requests',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      if (error.message.includes('already exists')) {
        throw new HttpException(
          {
            statusCode: HttpStatus.CONFLICT,
            message: error.message,
            error: 'Conflict',
          },
          HttpStatus.CONFLICT,
        );
      }

      // Generic bad request for other signup errors
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: error.message,
          error: 'Bad Request',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('logout')
  @ApiBearerAuth()
  logout() {
    return this.authService.signOut();
  }

  @Get('me')
  @ApiBearerAuth()
  me(@Request() req) {
    return req.authUser;
  }
}
