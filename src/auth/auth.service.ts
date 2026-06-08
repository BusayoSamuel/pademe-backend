import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { SupabaseService } from '../supabase/supabase.service';
import { LoginDto } from './dto/login.dto';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyResetOtpDto } from './dto/verify-reset-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabase: SupabaseService,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async login(dto: LoginDto) {
    const { data, error } = await this.supabase.anon.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error || !data.user || !data.session) {
      throw new BadRequestException(
        error?.message ?? 'Invalid email or password',
      );
    }

    return {
      id: data.user.id,
      email: data.user.email,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  }

  async register(dto: RegisterAuthDto) {
    const { data: authData, error: authError } =
      await this.supabase.admin.auth.admin.createUser({
        email: dto.email,
        password: dto.password,
        email_confirm: true,
      });

    if (authError || !authData.user) {
      throw new BadRequestException(
        authError?.message ?? 'Failed to create auth user',
      );
    }

    const session = await this.signIn(dto.email, dto.password);

    return {
      id: authData.user.id,
      email: authData.user.email,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    };
  }

  private async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.anon.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      throw new BadRequestException(
        error?.message ?? 'Account created but sign-in failed',
      );
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const { error } = await this.supabase.anon.auth.resetPasswordForEmail(
      dto.email,
    );

    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      message:
        'If an account exists for this email, a password reset code has been sent.',
    };
  }

  async verifyResetOtp(dto: VerifyResetOtpDto) {
    const { data, error } = await this.supabase.anon.auth.verifyOtp({
      email: dto.email,
      token: dto.otp,
      type: 'recovery',
    });

    if (error || !data.user || !data.session) {
      throw new BadRequestException(
        error?.message ?? 'Invalid or expired reset code',
      );
    }

    return {
      id: data.user.id,
      email: data.user.email,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  }

  async resetPassword(accessToken: string, dto: ResetPasswordDto) {
    const client = this.supabase.clientForUser(accessToken);
    const { error } = await client.auth.updateUser({
      password: dto.password,
    });

    if (error) {
      throw new BadRequestException(
        error.message ?? 'Failed to update password',
      );
    }

    return { message: 'Password updated successfully' };
  }

  async refreshTokens(dto: RefreshTokenDto) {
    const { data, error } = await this.supabase.anon.auth.refreshSession({
      refresh_token: dto.refreshToken,
    });

    if (error || !data.session) {
      throw new BadRequestException(
        error?.message ?? 'Invalid or expired refresh token',
      );
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in ?? 3600,
    };
  }

  async signOut(accessToken: string) {
    const { error } = await this.supabase.admin.auth.admin.signOut(
      accessToken,
      'global',
    );

    if (error) {
      throw new BadRequestException(error.message);
    }

    return { message: 'Signed out successfully' };
  }

  async deleteAccount(userId: string, accessToken: string) {
    const profile = await this.usersRepo.findOne({ where: { id: userId } });
    if (profile) {
      await this.usersRepo.remove(profile);
    }

    const { error: signOutError } =
      await this.supabase.admin.auth.admin.signOut(accessToken, 'global');
    if (signOutError) {
      throw new BadRequestException(signOutError.message);
    }

    const { error: deleteError } =
      await this.supabase.admin.auth.admin.deleteUser(userId);

    if (deleteError) {
      throw new InternalServerErrorException(
        deleteError.message ?? 'Failed to delete auth account',
      );
    }

    return { message: 'Account deleted successfully' };
  }
}
