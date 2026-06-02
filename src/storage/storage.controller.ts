import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { SupabaseService } from '../supabase/supabase.service';
import { StorageService } from './storage.service';

@Controller('storage')
export class StorageController {
  constructor(
    private readonly storage: StorageService,
    private readonly supabase: SupabaseService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { id: string },
  ) {
    if (!file) {
      throw new BadRequestException('file is required');
    }

    const bucket = this.supabase.defaultBucket;
    const ext = file.originalname.split('.').pop() ?? 'bin';
    const path = `${user.id}/${randomUUID()}.${ext}`;

    const result = await this.storage.upload(
      bucket,
      path,
      file.buffer,
      file.mimetype,
    );

    return {
      bucket,
      path: result.path,
      publicUrl: this.storage.getPublicUrl(bucket, result.path),
    };
  }

  @Get('signed-url')
  async signedUrl(
    @Query('path') path: string,
    @Query('expiresIn') expiresIn?: string,
  ) {
    const bucket = this.supabase.defaultBucket;
    const seconds = expiresIn ? Number.parseInt(expiresIn, 10) : 3600;
    const signedUrl = await this.storage.createSignedUrl(bucket, path, seconds);
    return { signedUrl };
  }

  @Delete()
  async remove(@Query('path') path: string) {
    if (!path) {
      throw new BadRequestException('path query parameter is required');
    }
    const bucket = this.supabase.defaultBucket;
    await this.storage.remove(bucket, [path]);
    return { deleted: path };
  }

  /** Example: read rows via PostgREST with the user's JWT (RLS enforced). */
  @Public()
  @Get('db-example')
  dbExampleInfo() {
    return {
      hint: 'Use supabase.clientForUser(accessToken).from("your_table").select() in your services.',
    };
  }
}
