import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
  ApiTags,
} from '@nestjs/swagger';
import type { User as AuthUser } from '@supabase/supabase-js';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SWAGGER_BEARER_AUTH } from '../swagger/swagger.config';
import { CreateUserProfileDto } from './dto/create-user-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PublicUserProfileDto } from './dto/public-user-profile.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create user profile',
    description:
      'Inserts a row in `public.users`. `id` and `email` must match the Bearer token from auth register.',
  })
  @ApiCreatedResponse({ type: UserResponseDto })
  createProfile(
    @CurrentUser() authUser: AuthUser,
    @Body() dto: CreateUserProfileDto,
  ) {
    return this.usersService.createProfile(authUser.id, authUser.email, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ type: UserResponseDto })
  getMe(@CurrentUser() authUser: AuthUser) {
    return this.usersService.getMe(authUser.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiOkResponse({ type: UserResponseDto })
  updateMe(@CurrentUser() authUser: AuthUser, @Body() dto: UpdateUserDto) {
    return this.usersService.updateProfile(authUser.id, dto);
  }

  @Post('me/profile-photo')
  @ApiOperation({ summary: 'Upload profile photo' })
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
  @ApiCreatedResponse({ type: UserResponseDto })
  @UseInterceptors(FileInterceptor('file'))
  uploadProfilePhoto(
    @CurrentUser() authUser: AuthUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.uploadProfilePhoto(authUser.id, file);
  }

  @Public()
  @Get(':userId')
  @ApiOperation({ summary: 'Get public user profile' })
  @ApiOkResponse({ type: PublicUserProfileDto })
  getPublicProfile(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.usersService.getPublicProfile(userId);
  }
}
