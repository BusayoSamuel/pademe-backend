import { StorageService } from '../storage/storage.service';
import { ConversationResponseDto } from './dto/conversation-response.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';

export function toConversationResponse(
  conversation: Conversation,
): ConversationResponseDto {
  return {
    id: conversation.id,
    askId: conversation.askId,
    askerId: conversation.askerId,
    doerId: conversation.doerId,
    lastMessageAt: conversation.lastMessageAt,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}

export function toMessageResponse(
  message: Message,
  storage: StorageService,
  bucket: string,
): MessageResponseDto {
  const attachmentUrl = message.attachmentPath
    ? storage.getPublicUrl(bucket, message.attachmentPath)
    : null;

  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    body: message.body,
    attachmentPath: message.attachmentPath,
    attachmentUrl,
    createdAt: message.createdAt,
  };
}
