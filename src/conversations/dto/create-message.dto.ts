import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({ example: 'Hi, when can you start?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  body: string;

  @ApiPropertyOptional({
    description: 'Storage path if attachment already uploaded',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  attachmentPath?: string;
}
