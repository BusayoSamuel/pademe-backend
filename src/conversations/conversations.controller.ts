import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SWAGGER_BEARER_AUTH } from '../swagger/swagger.config';
import { CreateMessageDto } from './dto/create-message.dto';
import { ConversationResponseDto } from './dto/conversation-response.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { ConversationsService } from './conversations.service';

@ApiTags('Conversations')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get('my')
  @ApiOperation({ summary: 'List my conversations (asker or doer)' })
  @ApiOkResponse({ type: ConversationResponseDto, isArray: true })
  listMine(@CurrentUser() authUser: AuthUser) {
    return this.conversationsService.findMyConversations(authUser.id);
  }

  @Get('by-ask')
  @ApiOperation({ summary: 'Get conversation for an ask' })
  @ApiQuery({ name: 'askId', required: true, format: 'uuid' })
  @ApiOkResponse({ type: ConversationResponseDto })
  findByAsk(
    @CurrentUser() authUser: AuthUser,
    @Query('askId', ParseUUIDPipe) askId: string,
  ) {
    return this.conversationsService.findByAskId(authUser.id, askId);
  }

  @Get(':conversationId')
  @ApiOperation({ summary: 'Get conversation by id' })
  @ApiOkResponse({ type: ConversationResponseDto })
  findOne(
    @CurrentUser() authUser: AuthUser,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
  ) {
    return this.conversationsService.findById(authUser.id, conversationId);
  }

  @Get(':conversationId/messages')
  @ApiOperation({ summary: 'List messages in a conversation' })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiOkResponse({ type: MessageResponseDto, isArray: true })
  listMessages(
    @CurrentUser() authUser: AuthUser,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.conversationsService.listMessages(
      authUser.id,
      conversationId,
      limit,
    );
  }

  @Post(':conversationId/messages')
  @ApiOperation({
    summary: 'Send a message',
    description:
      'Sets ask status to `in_conversation` when applicable. Updates conversation `lastMessageAt`.',
  })
  @ApiCreatedResponse({ type: MessageResponseDto })
  sendMessage(
    @CurrentUser() authUser: AuthUser,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.conversationsService.sendMessage(
      authUser.id,
      conversationId,
      dto,
    );
  }
}
