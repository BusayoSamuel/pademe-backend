import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class StorageService {
  constructor(private readonly supabase: SupabaseService) {}

  async upload(
    bucket: string,
    path: string,
    body: Buffer,
    contentType: string,
    options?: { upsert?: boolean },
  ) {
    const { data, error } = await this.supabase.admin.storage
      .from(bucket)
      .upload(path, body, {
        contentType,
        upsert: options?.upsert ?? false,
      });

    if (error) {
      throw new BadRequestException(error.message);
    }
    return data;
  }

  async createSignedUrl(bucket: string, path: string, expiresIn = 3600) {
    const { data, error } = await this.supabase.admin.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error || !data?.signedUrl) {
      throw new InternalServerErrorException(
        error?.message ?? 'Failed to create signed URL',
      );
    }
    return data.signedUrl;
  }

  async remove(bucket: string, paths: string[]) {
    const { data, error } = await this.supabase.admin.storage
      .from(bucket)
      .remove(paths);

    if (error) {
      throw new BadRequestException(error.message);
    }
    return data;
  }

  getPublicUrl(bucket: string, path: string) {
    const { data } = this.supabase.admin.storage
      .from(bucket)
      .getPublicUrl(path);
    return data.publicUrl;
  }
}
