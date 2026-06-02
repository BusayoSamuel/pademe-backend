import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateUserProfileDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Same id returned from POST /auth/register',
  })
  @IsUUID()
  id: string;

  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @IsDateString()
  dob: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phoneNo: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  countryCode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  country: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  area: string;
}
