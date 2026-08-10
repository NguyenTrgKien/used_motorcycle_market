import { IsEnum, IsInt, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { ReasonType, TargetType } from 'src/shared';

export class CreateReportDto {
  @IsEnum(TargetType)
  targetType: TargetType;

  @IsInt()
  @Min(1)
  targetId: number;

  @IsEnum(ReasonType)
  reasonType: ReasonType;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  reasonDetail: string;
}
