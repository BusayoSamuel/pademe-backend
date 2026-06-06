import { Controller, Get, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiFoundResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Stripe')
@Public()
@Controller('stripe/onboarding')
export class StripeOnboardingRedirectController {
  constructor(private readonly config: ConfigService) {}

  @Get('complete')
  @ApiOperation({
    summary: 'Stripe Connect return URL',
    description:
      'Stripe redirects here after onboarding. Responds with a 302 to the mobile app deep link.',
  })
  @ApiFoundResponse({
    description: 'Redirects to the app deep link (e.g. padememobile://stripe-onboarding?return=complete)',
  })
  complete(@Res() res: Response) {
    const appUrl =
      this.config.get<string>('stripe.connectAppReturnUrl') ??
      'padememobile://stripe-onboarding?return=complete';

    return res.redirect(302, appUrl);
  }

  @Get('refresh')
  @ApiOperation({
    summary: 'Stripe Connect refresh URL',
    description:
      'Stripe redirects here when an onboarding link expires. Responds with a 302 to the mobile app deep link.',
  })
  @ApiFoundResponse({
    description: 'Redirects to the app deep link (e.g. padememobile://stripe-onboarding?return=refresh)',
  })
  refresh(@Res() res: Response) {
    const appUrl =
      this.config.get<string>('stripe.connectAppRefreshUrl') ??
      'padememobile://stripe-onboarding?return=refresh';

    return res.redirect(302, appUrl);
  }
}
