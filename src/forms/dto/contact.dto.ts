import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsISO8601,
  ValidateNested,
} from 'class-validator'
import { Type, Transform } from 'class-transformer'

class MetaDto {
  @IsString()
  userAgent: string

  @IsOptional()
  @IsString()
  referrer?: string | null

  @IsString()
  page: string

  @IsISO8601()
  ts: string
}

export class ContactDto {
  @IsNotEmpty()
  @IsString()
  name: string

  @IsNotEmpty()
  @IsEmail()
  email: string

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (value ?? '') as string)
  phone?: string | null // Opcional: acepta string, null o ausente

  @IsNotEmpty()
  @IsString()
  message: string

  @ValidateNested()
  @Type(() => MetaDto)
  meta: MetaDto

  @IsOptional()
  @IsString()
  turnstileToken?: string
}
