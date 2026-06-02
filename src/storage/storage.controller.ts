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
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { randomUUID } from 'node:crypto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { SWAGGER_BEARER_AUTH } from '../swagger/swagger.config';
import { SupabaseService } from '../supabase/supabase.service';
import { StorageService } from './storage.service';

@ApiTags('Storage')
@Controller('storage')
export class StorageController {
  constructor(
    private readonly storage: StorageService,
    private readonly supabase: SupabaseService,
  ) {}

  @Post('upload')
  @ApiBearerAuth(SWAGGER_BEARER_AUTH)
  @ApiOperation({ summary: 'Upload a file (generic)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
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
  @ApiBearerAuth(SWAGGER_BEARER_AUTH)
  @ApiOperation({ summary: 'Get a signed download URL' })
  @ApiQuery({ name: 'path', required: true })
  @ApiQuery({ name: 'expiresIn', required: false, example: 3600 })
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
  @ApiBearerAuth(SWAGGER_BEARER_AUTH)
  @ApiOperation({ summary: 'Delete a file by path' })
  @ApiQuery({ name: 'path', required: true })
  async remove(@Query('path') path: string) {
    if (!path) {
      throw new BadRequestException('path query parameter is required');
    }
    const bucket = this.supabase.defaultBucket;
    await this.storage.remove(bucket, [path]);
    return { deleted: path };
  }

  @Public()
  @Get('db-example')
  @ApiOperation({ summary: 'PostgREST usage hint (public)' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: { hint: { type: 'string' } },
    },
  })
  dbExampleInfo() {
    return {
      hint: 'Use supabase.clientForUser(accessToken).from("your_table").select() in your services.',
    };
  }
}
