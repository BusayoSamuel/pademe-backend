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
import { AuthTokensResponseDto } from './dto/auth-tokens-response.dto';
import { AuthRegisterResponseDto } from './dto/auth-register-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyResetOtpDto } from './dto/verify-reset-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'Sign in',
    description: 'Returns access and refresh tokens for an existing user.',
  })
  @ApiCreatedResponse({ type: AuthRegisterResponseDto })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

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

  @Public()
  @Post('forgot-password')
  @ApiOperation({
    summary: 'Request password reset OTP',
    description:
      'Sends a one-time password reset code to the given email via Supabase. ' +
      'Use `POST /auth/verify-reset-otp` to verify the code before setting a new password.',
  })
  @ApiOkResponse({ type: AuthMessageResponseDto })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('verify-reset-otp')
  @ApiOperation({
    summary: 'Verify password reset OTP',
    description:
      'Validates the reset code and returns a short-lived session. ' +
      'Use the `accessToken` as Bearer auth for `POST /auth/reset-password`.',
  })
  @ApiOkResponse({ type: AuthRegisterResponseDto })
  verifyResetOtp(@Body() dto: VerifyResetOtpDto) {
    return this.authService.verifyResetOtp(dto);
  }

  @ApiBearerAuth(SWAGGER_BEARER_AUTH)
  @Post('reset-password')
  @ApiOperation({
    summary: 'Set new password',
    description:
      'Sets a new password after OTP verification. ' +
      'Requires the `accessToken` returned by `POST /auth/verify-reset-otp`.',
  })
  @ApiOkResponse({ type: AuthMessageResponseDto })
  resetPassword(
    @Body() dto: ResetPasswordDto,
    @Req() req: RequestWithUser,
  ) {
    return this.authService.resetPassword(req.accessToken, dto);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Exchange a valid refresh token for a new access token and refresh token.',
  })
  @ApiOkResponse({ type: AuthTokensResponseDto })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto);
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
