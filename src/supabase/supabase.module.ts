import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import {
  SUPABASE_ADMIN_CLIENT,
  SUPABASE_ANON_CLIENT,
} from './supabase.constants';
import { SupabaseService } from './supabase.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: SUPABASE_ADMIN_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.getOrThrow<string>('supabase.url');
        const serviceRoleKey = config.getOrThrow<string>(
          'supabase.serviceRoleKey',
        );
        return createClient(url, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
      },
    },
    {
      provide: SUPABASE_ANON_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.getOrThrow<string>('supabase.url');
        const anonKey = config.getOrThrow<string>('supabase.anonKey');
        return createClient(url, anonKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
      },
    },
    SupabaseService,
  ],
  exports: [SupabaseService, SUPABASE_ADMIN_CLIENT, SUPABASE_ANON_CLIENT],
})
export class SupabaseModule {}
