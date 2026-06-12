import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StripeKycStatus } from '../../users/entities/user.entity';

export class ConnectStatusResponseDto {
  @ApiPropertyOptional({
    nullable: true,
    example: 'acct_123',
    description: 'Stripe Connect Express account id, if created.',
  })
  connectAccountId: string | null;

  @ApiProperty({
    enum: StripeKycStatus,
    example: StripeKycStatus.Pending,
    description: 'KYC state stored on the user profile.',
  })
  kycStatus: StripeKycStatus;

  @ApiProperty({
    example: false,
    description: 'Whether Stripe has enabled payouts on the connected account.',
  })
  payoutsEnabled: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether the connected account can receive destination charges.',
  })
  chargesEnabled: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether the user submitted Connect onboarding details.',
  })
  detailsSubmitted: boolean;

  @ApiProperty({
    example: true,
    description: 'True when additional onboarding is still required.',
  })
  onboardingRequired: boolean;

  @ApiPropertyOptional({
    type: [String],
    example: ['individual.verification.document'],
    description: 'Outstanding Stripe verification requirements.',
  })
  requirementsCurrentlyDue: string[];

  @ApiPropertyOptional({
    nullable: true,
    description: 'Stripe reason the account is disabled, if any.',
  })
  disabledReason: string | null;
}
