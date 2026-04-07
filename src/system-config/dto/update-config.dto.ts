import { IsOptional, IsString, IsObject } from 'class-validator'

export class UpdateSystemConfigDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  websiteUrl?: string

  @IsOptional()
  @IsString()
  address?: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsString()
  servicesUrl?: string

  @IsOptional()
  @IsString()
  email?: string

  @IsOptional()
  @IsString()
  logoUrl?: string

  @IsOptional()
  @IsString()
  faviconUrl?: string

  @IsOptional()
  @IsObject()
  social?: {
    linkedinUrl?: string
    instagramUrl?: string
    githubUrl?: string
    youtubeUrl?: string
    linkedinIconUrl?: string
    instagramIconUrl?: string
    githubIconUrl?: string
    youtubeIconUrl?: string
  }
}
