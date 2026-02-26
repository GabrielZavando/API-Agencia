import { IsString, IsOptional } from 'class-validator';

export class CreateReportDto {
  @IsString()
  clientId: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}
