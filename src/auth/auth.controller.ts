import { Body, Controller, Get, Post, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { Public } from 'src/config/guard/public.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  login(@Body() dto: LoginAuthDto) {
    return this.authService.login(dto);
  }

  @Post('register')
  @Public()
  register(@Body() dto: RegisterAuthDto) {
    return this.authService.register(dto);
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
