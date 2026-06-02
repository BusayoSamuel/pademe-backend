import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { User as AuthUser } from '@supabase/supabase-js';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SWAGGER_BEARER_AUTH } from '../swagger/swagger.config';
import { CreateOfferDto } from './dto/create-offer.dto';
import { OfferResponseDto } from './dto/offer-response.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { OffersService } from './offers.service';

@ApiTags('Offers')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create an offer on an ask',
    description:
      'Doer submits an offer. `doerId` must match the Bearer token. One offer per doer per ask.',
  })
  @ApiCreatedResponse({ type: OfferResponseDto })
  create(@CurrentUser() authUser: AuthUser, @Body() dto: CreateOfferDto) {
    return this.offersService.create(authUser.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List offers for an ask' })
  @ApiQuery({ name: 'askId', required: true, format: 'uuid' })
  @ApiOkResponse({ type: OfferResponseDto, isArray: true })
  listByAsk(@Query('askId', ParseUUIDPipe) askId: string) {
    return this.offersService.findByAskId(askId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get offer by id' })
  @ApiOkResponse({ type: OfferResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.offersService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update offer note (doer only)' })
  @ApiOkResponse({ type: OfferResponseDto })
  updateNote(
    @CurrentUser() authUser: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOfferDto,
  ) {
    return this.offersService.updateNote(authUser.id, id, dto);
  }
}
