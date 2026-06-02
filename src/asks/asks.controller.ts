import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { User as AuthUser } from '@supabase/supabase-js';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SWAGGER_BEARER_AUTH } from '../swagger/swagger.config';
import { ChooseOfferDto } from './dto/choose-offer.dto';
import { CompletedAsksCountDto } from './dto/completed-asks-count.dto';
import { CreateAskDto } from './dto/create-ask.dto';
import { ListAsksQueryDto } from './dto/list-asks-query.dto';
import { UpdateAskDto } from './dto/update-ask.dto';
import { UpdateAskStatusDto } from './dto/update-ask-status.dto';
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

  @Get('my/jobs')
  @ApiOperation({ summary: 'List asks where I am the doer' })
  @ApiOkResponse({ type: AskResponseDto, isArray: true })
  findMyJobs(@CurrentUser() authUser: AuthUser) {
    return this.asksService.findMyJobs(authUser.id);
  }

  @Get('my')
  @ApiOperation({ summary: 'List asks I posted (asker)' })
  @ApiOkResponse({ type: AskResponseDto, isArray: true })
  findMyAsks(@CurrentUser() authUser: AuthUser) {
    return this.asksService.findMyAsks(authUser.id);
  }

  @Public()
  @Get('completed-count')
  @ApiOperation({
    summary: 'Count completed asks for a doer',
    description: 'Returns how many asks the doer completed (status = payout).',
  })
  @ApiQuery({ name: 'doerId', required: true, format: 'uuid' })
  @ApiOkResponse({ type: CompletedAsksCountDto })
  getCompletedCount(@Query('doerId', ParseUUIDPipe) doerId: string) {
    return this.asksService.countCompletedByDoer(doerId);
  }

  @Get()
  @ApiOperation({
    summary: 'List asks',
    description: 'Browse asks with optional status filter and pagination.',
  })
  @ApiOkResponse({ type: AskResponseDto, isArray: true })
  findAll(@Query() query: ListAsksQueryDto) {
    return this.asksService.findAll(query);
  }

  @Get(':askId')
  @ApiOperation({ summary: 'Get ask by id' })
  @ApiOkResponse({ type: AskResponseDto })
  findOne(@Param('askId', ParseUUIDPipe) askId: string) {
    return this.asksService.findOne(askId);
  }

  @Patch(':askId/status')
  @ApiOperation({
    summary: 'Update ask status',
    description:
      'Advance status one step: waiting→in_conversation→meet_complete→payout. Payout: asker only.',
  })
  @ApiOkResponse({ type: AskResponseDto })
  updateStatus(
    @CurrentUser() authUser: AuthUser,
    @Param('askId', ParseUUIDPipe) askId: string,
    @Body() dto: UpdateAskStatusDto,
  ) {
    return this.asksService.updateStatus(authUser.id, askId, dto);
  }

  @Patch(':askId')
  @ApiOperation({
    summary: 'Update ask details',
    description: 'Asker only, while status is posted.',
  })
  @ApiOkResponse({ type: AskResponseDto })
  update(
    @CurrentUser() authUser: AuthUser,
    @Param('askId', ParseUUIDPipe) askId: string,
    @Body() dto: UpdateAskDto,
  ) {
    return this.asksService.update(authUser.id, askId, dto);
  }

  @Post(':askId/choose-offer')
  @ApiOperation({
    summary: 'Choose an offer (assign doer)',
    description:
      'Asker accepts an offer: sets `doerId` from the offer and ask `status` to `waiting`. Ask must be `posted`.',
  })
  @ApiOkResponse({ type: AskResponseDto })
  chooseOffer(
    @CurrentUser() authUser: AuthUser,
    @Param('askId', ParseUUIDPipe) askId: string,
    @Body() dto: ChooseOfferDto,
  ) {
    return this.asksService.chooseOffer(authUser.id, askId, dto);
  }

  @Delete(':askId')
  @ApiOperation({
    summary: 'Delete an ask',
    description:
      'Only the asker can delete. Related offers are removed (cascade).',
  })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: { deleted: { type: 'string', format: 'uuid' } },
    },
  })
  remove(
    @CurrentUser() authUser: AuthUser,
    @Param('askId', ParseUUIDPipe) askId: string,
  ) {
    return this.asksService.remove(authUser.id, askId);
  }
}
