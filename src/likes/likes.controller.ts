import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { User as AuthUser } from '@supabase/supabase-js';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SWAGGER_BEARER_AUTH } from '../swagger/swagger.config';
import { CreateLikeDto } from './dto/create-like.dto';
import { LikeResponseDto, UnlikeResponseDto } from './dto/like-response.dto';
import { LikesService } from './likes.service';

@ApiTags('Likes')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post()
  @ApiOperation({
    summary: 'Like an ask',
    description: 'One like per user per ask. Increments ask `likeCount`.',
  })
  @ApiCreatedResponse({ type: LikeResponseDto })
  like(@CurrentUser() authUser: AuthUser, @Body() dto: CreateLikeDto) {
    return this.likesService.like(authUser.id, dto);
  }

  @Delete(':askId')
  @ApiOperation({
    summary: 'Unlike an ask',
    description: 'Removes the current user like and decrements ask `likeCount`.',
  })
  @ApiOkResponse({ type: UnlikeResponseDto })
  unlike(
    @CurrentUser() authUser: AuthUser,
    @Param('askId', ParseUUIDPipe) askId: string,
  ) {
    return this.likesService.unlike(authUser.id, askId);
  }
}
