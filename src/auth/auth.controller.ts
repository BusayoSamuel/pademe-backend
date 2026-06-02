import { Body, Controller, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './decorators/public.decorator';
import { AuthService } from './auth.service';
import { AuthRegisterResponseDto } from './dto/auth-register-response.dto';
import { RegisterAuthDto } from './dto/register-auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Register auth credentials',
    description:
      'Creates a Supabase Auth user (email + password only). ' +
      'Use the returned `id` and `accessToken` for `POST /users`.',
  })
  @ApiCreatedResponse({ type: AuthRegisterResponseDto })
  register(@Body() dto: RegisterAuthDto) {
    return this.authService.register(dto);
  }
}
