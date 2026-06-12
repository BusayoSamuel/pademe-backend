import { Controller, Get, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { User as AuthUser } from '@supabase/supabase-js';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SWAGGER_BEARER_AUTH } from '../swagger/swagger.config';
import { ConnectStatusResponseDto } from './dto/connect-status-response.dto';
import { OnboardingLinkResponseDto } from './dto/onboarding-link-response.dto';
import { StripeService } from './stripe.service';

@ApiTags('Stripe')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@Controller('stripe/connect')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('onboarding')
  @ApiOperation({
    summary: 'Start Connect Express onboarding',
    description:
      'Doer onboarding. Creates a Stripe Express connected account if needed and returns a hosted onboarding URL for KYC and payout setup. ' +
      'After Stripe redirects to the backend return URL, the app is opened via the configured deep link.',
  })
  @ApiCreatedResponse({ type: OnboardingLinkResponseDto })
  createOnboardingLink(@CurrentUser() authUser: AuthUser) {
    return this.stripeService.createOnboardingLink(authUser.id);
  }

  @Get('status')
  @ApiOperation({
    summary: 'Refresh Connect onboarding status',
    description:
      'Fetches the latest KYC/payout/charges status from Stripe and updates the user profile. ' +
      'Use after onboarding or when checking whether a doer can receive payments.',
  })
  @ApiOkResponse({ type: ConnectStatusResponseDto })
  getConnectStatus(@CurrentUser() authUser: AuthUser) {
    return this.stripeService.refreshConnectStatus(authUser.id);
  }
}
