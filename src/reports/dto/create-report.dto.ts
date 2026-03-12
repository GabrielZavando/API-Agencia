import { IsString, IsOptional } from 'class-validator'

export class CreateReportDto {
  @IsString()
  clientId: string

  @IsString()
  title: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  projectId?: string

  @IsOptional()
  @IsString()
  projectName?: string
}
