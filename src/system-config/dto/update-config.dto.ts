import { IsOptional, IsString, IsBoolean, IsObject } from 'class-validator'

export class UpdateSystemConfigDto {
  @IsOptional()
  @IsString()
  siteName?: string

  @IsOptional()
  @IsString()
  contactEmail?: string

  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean

  @IsOptional()
  @IsBoolean()
  enableRegistrations?: boolean

  @IsOptional()
  @IsObject()
  features?: Record<string, boolean>

  @IsOptional()
  @IsObject()
  branding?: {
    primaryColor?: string
    logoUrl?: string
  }
}
