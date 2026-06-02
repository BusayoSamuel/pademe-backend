import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
}
