import { Ask } from './entities/ask.entity';
import { AskResponseDto } from './dto/ask-response.dto';

export function toAskResponse(ask: Ask): AskResponseDto {
  return {
    id: ask.id,
    title: ask.title,
    description: ask.description,
    location: ask.location,
    amount: Number(ask.amount),
    currency: ask.currency,
    dueDate: ask.dueDate,
    datePosted: ask.datePosted,
    urgency: ask.urgency,
    status: ask.status,
    askerId: ask.askerId,
    doerId: ask.doerId,
    createdAt: ask.createdAt,
    updatedAt: ask.updatedAt,
  };
}
