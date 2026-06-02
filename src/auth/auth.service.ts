import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { SupabaseService } from '../supabase/supabase.service';
import { RegisterAuthDto } from './dto/register-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabase: SupabaseService,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

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
