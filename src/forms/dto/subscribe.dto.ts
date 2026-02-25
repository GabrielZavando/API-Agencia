import {
  IsEmail,
  IsISO8601,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class SubscribeMetaDto {
  @IsString()
  userAgent: string;

  @IsOptional()
  @IsString()
  referrer?: string | null;

  @IsString()
  page: string;

  @IsISO8601()
  ts: string; // ISO-8601 desde el frontend
}

export class SubscribeDto {
  @IsEmail()
  email: string;

  @ValidateNested()
  @Type(() => SubscribeMetaDto)
  meta: SubscribeMetaDto;
}
