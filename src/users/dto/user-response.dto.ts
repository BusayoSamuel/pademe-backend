import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'jane@example.com' })
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ example: '1990-05-15' })
  dob: string;

  @ApiProperty()
  phoneNo: string;

  @ApiProperty({ example: '+234' })
  countryCode: string;

  @ApiProperty()
  country: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  area: string;

  @ApiPropertyOptional({ nullable: true })
  profilePhotoPath: string | null;

  @ApiPropertyOptional({ nullable: true })
  profilePhotoUrl: string | null;

  @ApiPropertyOptional({ nullable: true, example: null })
  averageRating: number | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
