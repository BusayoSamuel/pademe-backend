import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';

@Global()
@Module({
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
