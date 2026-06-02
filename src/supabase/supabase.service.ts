import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import {
  SUPABASE_ADMIN_CLIENT,
  SUPABASE_ANON_CLIENT,
} from './supabase.constants';

@Injectable()
export class SupabaseService {
  constructor(
    @Inject(SUPABASE_ADMIN_CLIENT)
    private readonly adminClient: SupabaseClient,
    @Inject(SUPABASE_ANON_CLIENT)
    private readonly anonClient: SupabaseClient,
    private readonly config: ConfigService,
  ) {}

  /** Service-role client — bypasses RLS. Use only on the server. */
  get admin(): SupabaseClient {
    return this.adminClient;
  }

  /** Public anon client — respects RLS when using a user JWT. */
  get anon(): SupabaseClient {
    return this.anonClient;
  }

  get defaultBucket(): string {
    return this.config.get<string>('storage.defaultBucket', 'uploads');
  }

  /** Validate a Supabase access token and return the user. */
  async getUserFromToken(accessToken: string) {
    const { data, error } = await this.admin.auth.getUser(accessToken);
    if (error || !data.user) {
      return { user: null, error: error ?? new Error('Invalid token') };
    }
    return { user: data.user, error: null };
  }

  /** PostgREST / Storage / Auth with the end-user's JWT (RLS applies). */
  clientForUser(accessToken: string) {
    const url = this.config.getOrThrow<string>('supabase.url');
    const anonKey = this.config.getOrThrow<string>('supabase.anonKey');

    return createClient(url, anonKey, {
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
}
