import { BadRequestException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { RegisterAuthDto } from './dto/register-auth.dto';

@Injectable()
export class AuthService {
  constructor(private readonly supabase: SupabaseService) {}

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
}
