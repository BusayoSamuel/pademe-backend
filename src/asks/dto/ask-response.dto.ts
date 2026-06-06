import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AskStatus, AskUrgency } from '../entities/ask.entity';

export class AskResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  location: string;

  @ApiProperty({ example: 15000 })
  amount: number;

  @ApiProperty({ example: 'NGN' })
  currency: string;

  @ApiProperty({ example: '2026-06-15' })
  dueDate: string;

  @ApiProperty()
  datePosted: Date;

  @ApiProperty({ enum: AskUrgency })
  urgency: AskUrgency;

  @ApiProperty({ enum: AskStatus })
  status: AskStatus;

  @ApiProperty({ format: 'uuid' })
  askerId: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  doerId: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'prod_123' })
  stripeProductId: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: 'price_123',
    description: 'Stripe one-off price ID for asker checkout',
  })
  stripePriceId: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
