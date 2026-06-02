import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ask, AskStatus } from '../asks/entities/ask.entity';
import { StorageService } from '../storage/storage.service';
import { SupabaseService } from '../supabase/supabase.service';
import {
  toConversationResponse,
  toMessageResponse,
} from './conversation.mapper';
import { CreateMessageDto } from './dto/create-message.dto';
import { ConversationResponseDto } from './dto/conversation-response.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationsRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messagesRepo: Repository<Message>,
    @InjectRepository(Ask)
    private readonly asksRepo: Repository<Ask>,
    private readonly storage: StorageService,
    private readonly supabase: SupabaseService,
  ) {}

  async createForAsk(ask: Ask): Promise<ConversationResponseDto> {
    if (!ask.doerId) {
      throw new BadRequestException(
        'Ask must have a doer before creating a conversation',
      );
    }

    const existing = await this.conversationsRepo.findOne({
      where: { askId: ask.id },
    });
    if (existing) {
      return toConversationResponse(existing);
    }

    const conversation = this.conversationsRepo.create({
      askId: ask.id,
      askerId: ask.askerId,
      doerId: ask.doerId,
      lastMessageAt: null,
    });

    const saved = await this.conversationsRepo.save(conversation);
    return toConversationResponse(saved);
  }

  async findMyConversations(
    authUserId: string,
  ): Promise<ConversationResponseDto[]> {
    const conversations = await this.conversationsRepo.find({
      where: [{ askerId: authUserId }, { doerId: authUserId }],
      order: { lastMessageAt: 'DESC', createdAt: 'DESC' },
    });

    return conversations.map(toConversationResponse);
  }

  async findByAskId(
    authUserId: string,
    askId: string,
  ): Promise<ConversationResponseDto> {
    const conversation = await this.conversationsRepo.findOne({
      where: { askId },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found for this ask');
    }

    this.assertParticipant(conversation, authUserId);
    return toConversationResponse(conversation);
  }

  async findById(
    authUserId: string,
    conversationId: string,
  ): Promise<ConversationResponseDto> {
    const conversation = await this.conversationsRepo.findOne({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    this.assertParticipant(conversation, authUserId);
    return toConversationResponse(conversation);
  }

  async listMessages(
    authUserId: string,
    conversationId: string,
    limit = 50,
  ): Promise<MessageResponseDto[]> {
    const conversation = await this.getConversationOrFail(conversationId);
    this.assertParticipant(conversation, authUserId);

    const take = Math.min(Math.max(limit, 1), 100);
    const messages = await this.messagesRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
      take,
    });

    return messages.map((m) =>
      toMessageResponse(m, this.storage, this.supabase.defaultBucket),
    );
  }

  async sendMessage(
    authUserId: string,
    conversationId: string,
    dto: CreateMessageDto,
  ): Promise<MessageResponseDto> {
    const conversation = await this.getConversationOrFail(conversationId);
    this.assertParticipant(conversation, authUserId);

    const message = this.messagesRepo.create({
      conversationId,
      senderId: authUserId,
      body: dto.body,
      attachmentPath: dto.attachmentPath ?? null,
    });

    const saved = await this.messagesRepo.save(message);

    conversation.lastMessageAt = saved.createdAt;
    await this.conversationsRepo.save(conversation);

    const ask = await this.asksRepo.findOne({
      where: { id: conversation.askId },
    });
    if (
      ask &&
      (ask.status === AskStatus.Waiting ||
        ask.status === AskStatus.InConversation)
    ) {
      ask.status = AskStatus.InConversation;
      await this.asksRepo.save(ask);
    }

    return toMessageResponse(saved, this.storage, this.supabase.defaultBucket);
  }

  private async getConversationOrFail(
    conversationId: string,
  ): Promise<Conversation> {
    const conversation = await this.conversationsRepo.findOne({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    return conversation;
  }

  private assertParticipant(conversation: Conversation, userId: string): void {
    if (conversation.askerId !== userId && conversation.doerId !== userId) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }
  }
}
