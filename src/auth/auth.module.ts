import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [AuthController],
  providers: [
    AuthService,
    SupabaseAuthGuard,
    {
      provide: APP_GUARD,
      useClass: SupabaseAuthGuard,
    },
  ],
  exports: [SupabaseAuthGuard, AuthService],
})
export class AuthModule {}
