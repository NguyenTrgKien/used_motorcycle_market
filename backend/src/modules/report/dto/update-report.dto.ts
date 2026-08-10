import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ReportStatus } from 'src/shared';

export class UpdateReportDto {
  @IsEnum(ReportStatus)
  status: ReportStatus;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  note?: string;
}
