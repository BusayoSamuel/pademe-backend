import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThan, Not, Repository } from 'typeorm';
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

const LOCATION_PREFIX = '__askapade_location__';
const IMAGE_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'heic',
  'heif',
]);

function isImageAttachment(path: string | null | undefined): boolean {
  if (!path) return false;
  const clean = path.split('?')[0] ?? path;
  const ext = clean.split('.').pop()?.toLowerCase() ?? '';
  return IMAGE_EXTENSIONS.has(ext);
}

function toLastMessagePreview(
  body: string,
  attachmentPath: string | null,
): string {
  if (body.trim().startsWith(LOCATION_PREFIX)) {
    return 'Shared location';
  }

  if (attachmentPath) {
    if (isImageAttachment(attachmentPath)) {
      return 'Photo';
    }
    const fileName = body.split('\n')[0]?.trim();
    return fileName || 'Attachment';
  }

  const trimmed = body.trim();
  return trimmed || 'Message';
}

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
      askerLastReadAt: null,
      doerLastReadAt: null,
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

    const conversationIds = conversations.map((item) => item.id);
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

    const lastMessages = await this.messagesRepo
      .createQueryBuilder('message')
      .distinctOn(['message.conversationId'])
      .where('message.conversationId IN (:...conversationIds)', {
        conversationIds,
      })
      .orderBy('message.conversationId')
      .addOrderBy('message.createdAt', 'DESC')
      .getMany();
    const lastMessageByConversationId = new Map(
      lastMessages.map((message) => [message.conversationId, message]),
    );

    const unreadByConversationId = new Map<string, number>();
    await Promise.all(
      conversations.map(async (conversation) => {
        const lastReadAt =
          conversation.askerId === authUserId
            ? conversation.askerLastReadAt
            : conversation.doerLastReadAt;

        const where = lastReadAt
          ? {
              conversationId: conversation.id,
              senderId: Not(authUserId),
              createdAt: MoreThan(lastReadAt),
            }
          : {
              conversationId: conversation.id,
              senderId: Not(authUserId),
            };

        const count = await this.messagesRepo.count({ where });
        unreadByConversationId.set(conversation.id, count);
      }),
    );

    return conversations.map((conversation) => {
      const ask = asksById.get(conversation.askId);
      const counterpartId =
        conversation.askerId === authUserId
          ? conversation.doerId
          : conversation.askerId;
      const counterpart = counterpartsById.get(counterpartId);
      const lastMessage = lastMessageByConversationId.get(conversation.id);

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
        lastMessagePreview: lastMessage
          ? toLastMessagePreview(lastMessage.body, lastMessage.attachmentPath)
          : null,
        unreadCount: unreadByConversationId.get(conversation.id) ?? 0,
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

    const lastMessage = await this.messagesRepo.findOne({
      where: { conversationId: conversation.id },
      order: { createdAt: 'DESC' },
    });

    const lastReadAt =
      conversation.askerId === authUserId
        ? conversation.askerLastReadAt
        : conversation.doerLastReadAt;
    const unreadWhere = lastReadAt
      ? {
          conversationId: conversation.id,
          senderId: Not(authUserId),
          createdAt: MoreThan(lastReadAt),
        }
      : {
          conversationId: conversation.id,
          senderId: Not(authUserId),
        };
    const unreadCount = await this.messagesRepo.count({ where: unreadWhere });

    return {
      ...toConversationResponse(conversation),
      askTitle: ask?.title ?? 'Ask',
      askStatus: ask?.status,
      myRole: conversation.askerId === authUserId ? 'asker' : 'doer',
      counterpart,
      lastMessagePreview: lastMessage
        ? toLastMessagePreview(lastMessage.body, lastMessage.attachmentPath)
        : null,
      unreadCount,
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

    await this.markConversationRead(conversation, authUserId);

    return Promise.all(
      messages.map((m) =>
        toMessageResponse(m, this.storage, this.supabase.defaultBucket),
      ),
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
    await this.markConversationRead(conversation, authUserId);

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

  private async markConversationRead(
    conversation: Conversation,
    authUserId: string,
  ): Promise<void> {
    const now = new Date();
    if (conversation.askerId === authUserId) {
      conversation.askerLastReadAt = now;
    } else if (conversation.doerId === authUserId) {
      conversation.doerLastReadAt = now;
    }
    await this.conversationsRepo.save(conversation);
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
