import { StorageService } from '../storage/storage.service';
import { ConversationResponseDto } from './dto/conversation-response.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';

/** Signed URL lifetime for chat attachment previews. */
const ATTACHMENT_SIGNED_URL_SECONDS = 60 * 60 * 24; // 24 hours

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

export async function toMessageResponse(
  message: Message,
  storage: StorageService,
  bucket: string,
): Promise<MessageResponseDto> {
  let attachmentUrl: string | null = null;

  if (message.attachmentPath) {
    try {
      // Bucket is private — public URLs 404; clients need signed URLs.
      attachmentUrl = await storage.createSignedUrl(
        bucket,
        message.attachmentPath,
        ATTACHMENT_SIGNED_URL_SECONDS,
      );
    } catch {
      attachmentUrl = null;
    }
  }

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
