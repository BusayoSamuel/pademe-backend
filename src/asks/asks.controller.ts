import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { User as AuthUser } from '@supabase/supabase-js';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SWAGGER_BEARER_AUTH } from '../swagger/swagger.config';
import { CreateAskDto } from './dto/create-ask.dto';
import { AskResponseDto } from './dto/ask-response.dto';
import { AsksService } from './asks.service';

@ApiTags('Asks')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@Controller('asks')
export class AsksController {
  constructor(private readonly asksService: AsksService) {}

  @Post()
  @ApiOperation({
    summary: 'Create an ask',
    description:
      'Creates a new ask. `askerId` must match the Bearer token user. `doerId` is null until assigned.',
  })
  @ApiCreatedResponse({ type: AskResponseDto })
  create(@CurrentUser() authUser: AuthUser, @Body() dto: CreateAskDto) {
    return this.asksService.create(authUser.id, dto);
  }
}
