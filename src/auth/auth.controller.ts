import { Body, Controller, Delete, Post, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { User as AuthUser } from '@supabase/supabase-js';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import type { RequestWithUser } from './decorators/current-user.decorator';
import { SWAGGER_BEARER_AUTH } from '../swagger/swagger.config';
import { AuthMessageResponseDto } from './dto/auth-message-response.dto';
import { AuthRegisterResponseDto } from './dto/auth-register-response.dto';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { AuthService } from './auth.service';

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

  @ApiBearerAuth(SWAGGER_BEARER_AUTH)
  @Post('sign-out')
  @ApiOperation({
    summary: 'Sign out',
    description:
      'Revokes the current session (and all sessions with global scope). ' +
      'Client should also discard stored tokens.',
  })
  @ApiOkResponse({ type: AuthMessageResponseDto })
  signOut(@Req() req: RequestWithUser) {
    return this.authService.signOut(req.accessToken);
  }

  @ApiBearerAuth(SWAGGER_BEARER_AUTH)
  @Delete('account')
  @ApiOperation({
    summary: 'Delete account',
    description:
      'Deletes the user profile, signs out all sessions, and removes the Supabase Auth user.',
  })
  @ApiOkResponse({ type: AuthMessageResponseDto })
  deleteAccount(
    @CurrentUser() authUser: AuthUser,
    @Req() req: RequestWithUser,
  ) {
    return this.authService.deleteAccount(authUser.id, req.accessToken);
  }
}
