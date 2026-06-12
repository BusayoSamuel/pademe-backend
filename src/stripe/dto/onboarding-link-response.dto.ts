import { ApiProperty } from '@nestjs/swagger';

export class OnboardingLinkResponseDto {
  @ApiProperty({
    example: 'https://connect.stripe.com/setup/...',
    description: 'Hosted Stripe Connect onboarding URL. Open in a browser or WebView.',
  })
  url: string;

  @ApiProperty({
    example: 1717603200,
    description: 'Unix timestamp when the onboarding link expires.',
  })
  expiresAt: number;
}
