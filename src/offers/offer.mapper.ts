import { OfferResponseDto } from './dto/offer-response.dto';
import { Offer } from './entities/offer.entity';

export function toOfferResponse(offer: Offer): OfferResponseDto {
  return {
    id: offer.id,
    askId: offer.askId,
    doerId: offer.doerId,
    note: offer.note,
    createdAt: offer.createdAt,
    updatedAt: offer.updatedAt,
  };
}
