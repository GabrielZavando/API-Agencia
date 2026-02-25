import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsISO8601,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class MetaDto {
  @IsString()
  userAgent: string;

  @IsOptional()
  @IsString()
  referrer?: string | null;

  @IsString()
  page: string;

  @IsISO8601()
  ts: string;
}

export class ContactDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  phone: string; // Obligatorio pero puede ser string vacío

  @IsNotEmpty()
  @IsString()
  message: string;

  @ValidateNested()
  @Type(() => MetaDto)
  meta: MetaDto;
}
