import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator'

export class AddMessageDto {
  @IsString()
  @IsNotEmpty()
  body: string

  @IsString()
  @IsIn(['admin', 'client'])
  senderRole: 'admin' | 'client'

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  senderPhotoUrl?: string
}
