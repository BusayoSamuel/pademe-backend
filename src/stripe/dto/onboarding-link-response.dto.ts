import { ApiProperty } from '@nestjs/swagger';

export class OnboardingLinkResponseDto {
  @ApiProperty({ example: 'https://connect.stripe.com/setup/...' })
  url: string;

  @ApiProperty({ example: 1717603200 })
  expiresAt: number;
}
