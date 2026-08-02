import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { MessageType } from 'src/shared';

export class CreateMessageDto {
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  content?: string;

  @IsEnum(MessageType)
  @IsOptional()
  messageType?: MessageType;
}
