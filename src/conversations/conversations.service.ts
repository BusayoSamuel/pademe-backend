import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Ask, AskStatus } from '../asks/entities/ask.entity';
import { StorageService } from '../storage/storage.service';
import { SupabaseService } from '../supabase/supabase.service';
import { UsersService } from '../users/users.service';
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
    private readonly usersService: UsersService,
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

    if (conversations.length === 0) {
      return [];
    }

    const askIds = [...new Set(conversations.map((item) => item.askId))];
    const asks = await this.asksRepo.find({ where: { id: In(askIds) } });
    const asksById = new Map(asks.map((ask) => [ask.id, ask]));

    const counterpartIds = [
      ...new Set(
        conversations.map((item) =>
          item.askerId === authUserId ? item.doerId : item.askerId,
        ),
      ),
    ];

    const counterparts = await Promise.all(
      counterpartIds.map(async (id) => {
        try {
          const profile = await this.usersService.getPublicProfile(id);
          return [id, profile] as const;
        } catch {
          return [id, null] as const;
        }
      }),
    );
    const counterpartsById = new Map(counterparts);

    return conversations.map((conversation) => {
      const ask = asksById.get(conversation.askId);
      const counterpartId =
        conversation.askerId === authUserId
          ? conversation.doerId
          : conversation.askerId;
      const counterpart = counterpartsById.get(counterpartId);

      return {
        ...toConversationResponse(conversation),
        askTitle: ask?.title ?? 'Ask',
        askStatus: ask?.status,
        myRole: conversation.askerId === authUserId ? 'asker' : 'doer',
        counterpart: counterpart
          ? {
              id: counterpart.id,
              firstName: counterpart.firstName,
              lastName: counterpart.lastName,
              profilePhotoUrl: counterpart.profilePhotoUrl,
            }
          : {
              id: counterpartId,
              firstName: 'Askapade',
              lastName: 'member',
              profilePhotoUrl: null,
            },
        unreadCount: 0,
      };
    });
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
    return this.toEnrichedConversation(conversation, authUserId);
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
    return this.toEnrichedConversation(conversation, authUserId);
  }

  private async toEnrichedConversation(
    conversation: Conversation,
    authUserId: string,
  ): Promise<ConversationResponseDto> {
    const ask = await this.asksRepo.findOne({
      where: { id: conversation.askId },
    });
    const counterpartId =
      conversation.askerId === authUserId
        ? conversation.doerId
        : conversation.askerId;

    let counterpart: ConversationResponseDto['counterpart'] = {
      id: counterpartId,
      firstName: 'Askapade',
      lastName: 'member',
      profilePhotoUrl: null,
    };

    try {
      const profile = await this.usersService.getPublicProfile(counterpartId);
      counterpart = {
        id: profile.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        profilePhotoUrl: profile.profilePhotoUrl,
      };
    } catch {
      // Keep placeholder counterpart when profile lookup fails.
    }

    return {
      ...toConversationResponse(conversation),
      askTitle: ask?.title ?? 'Ask',
      askStatus: ask?.status,
      myRole: conversation.askerId === authUserId ? 'asker' : 'doer',
      counterpart,
      unreadCount: 0,
    };
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
