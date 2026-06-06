import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StripeKycStatus } from '../entities/user.entity';

export class UserStripeDto {
  @ApiPropertyOptional({ nullable: true, example: 'acct_123' })
  connectAccountId: string | null;

  @ApiProperty({ enum: StripeKycStatus, example: StripeKycStatus.None })
  kycStatus: StripeKycStatus;

  @ApiProperty({ example: false })
  payoutsEnabled: boolean;

  @ApiProperty({ example: false })
  chargesEnabled: boolean;

  @ApiProperty({
    description:
      'True when the user must complete the Stripe Connect hosted onboarding flow',
    example: true,
  })
  onboardingRequired: boolean;
}
