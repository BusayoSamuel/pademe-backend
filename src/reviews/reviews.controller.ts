import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
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
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { User as AuthUser } from '@supabase/supabase-js';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SWAGGER_BEARER_AUTH } from '../swagger/swagger.config';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewResponseDto } from './dto/review-response.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('Reviews')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a review',
    description:
      'Reviewer rates another user. `reviewerId` must match Bearer token. `type` is `doer` or `asker`.',
  })
  @ApiCreatedResponse({ type: ReviewResponseDto })
  create(@CurrentUser() authUser: AuthUser, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(authUser.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List reviews for a user (reviewee)' })
  @ApiQuery({ name: 'revieweeId', required: true, format: 'uuid' })
  @ApiOkResponse({ type: ReviewResponseDto, isArray: true })
  listByReviewee(@Query('revieweeId', ParseUUIDPipe) revieweeId: string) {
    return this.reviewsService.findByRevieweeId(revieweeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get review by id' })
  @ApiOkResponse({ type: ReviewResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update review (reviewer only)' })
  @ApiOkResponse({ type: ReviewResponseDto })
  update(
    @CurrentUser() authUser: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(authUser.id, id, dto);
  }

  @Post(':id/photo')
  @ApiOperation({ summary: 'Upload review photo (reviewer only)' })
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
  @ApiCreatedResponse({ type: ReviewResponseDto })
  @UseInterceptors(FileInterceptor('file'))
  uploadPhoto(
    @CurrentUser() authUser: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.reviewsService.uploadPhoto(authUser.id, id, file);
  }
}
