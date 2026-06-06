import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StripeKycStatus } from '../../users/entities/user.entity';

export class ConnectStatusResponseDto {
  @ApiPropertyOptional({ nullable: true, example: 'acct_123' })
  connectAccountId: string | null;

  @ApiProperty({ enum: StripeKycStatus, example: StripeKycStatus.Pending })
  kycStatus: StripeKycStatus;

  @ApiProperty({ example: false })
  payoutsEnabled: boolean;

  @ApiProperty({ example: false })
  chargesEnabled: boolean;

  @ApiProperty({ example: false })
  detailsSubmitted: boolean;

  @ApiProperty({ example: true })
  onboardingRequired: boolean;

  @ApiPropertyOptional({ type: [String], example: ['individual.verification.document'] })
  requirementsCurrentlyDue: string[];

  @ApiPropertyOptional({ nullable: true })
  disabledReason: string | null;
}
