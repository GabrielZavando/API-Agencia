import { IsString, IsOptional } from 'class-validator';

export class UploadFileDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}
