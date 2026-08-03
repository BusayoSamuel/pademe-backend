import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AskStatus } from '../../asks/entities/ask.entity';

export class ConversationCounterpartDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiPropertyOptional({ nullable: true })
  profilePhotoUrl: string | null;
}

export class ConversationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  askId: string;

  @ApiProperty({ format: 'uuid' })
  askerId: string;

  @ApiProperty({ format: 'uuid' })
  doerId: string;

  @ApiPropertyOptional({ nullable: true })
  lastMessageAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Ask title for inbox preview' })
  askTitle?: string;

  @ApiPropertyOptional({ enum: AskStatus })
  askStatus?: AskStatus;

  @ApiPropertyOptional({ enum: ['asker', 'doer'] })
  myRole?: 'asker' | 'doer';

  @ApiPropertyOptional({ type: ConversationCounterpartDto })
  counterpart?: ConversationCounterpartDto;

  @ApiPropertyOptional({ description: 'Unread message count' })
  unreadCount?: number;
}
