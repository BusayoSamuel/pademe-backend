import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';

export class PublicUserProfileDto extends UserResponseDto {
  @ApiProperty({
    description: 'Completed asks as doer (status = payout)',
    example: 12,
  })
  completedAsksCount: number;
}
