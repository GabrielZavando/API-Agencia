// DTO for creating a project
import { IsString, IsArray, IsOptional, IsEnum, IsUrl } from 'class-validator';

export enum ProjectStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export class CreateProjectDto {
  @IsString()
  clientId: string; // Relación con Users (role: client)

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  files?: string[]; // URLs de archivos

  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  reports?: string[]; // URLs de informes o IDs de colección reports
}
