import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  conversationId: string;

  @ApiProperty({ format: 'uuid' })
  senderId: string;

  @ApiProperty()
  body: string;

  @ApiPropertyOptional({ nullable: true })
  attachmentPath: string | null;

  @ApiPropertyOptional({ nullable: true })
  attachmentUrl: string | null;

  @ApiProperty()
  createdAt: Date;
}
