import { IsString, IsNotEmpty, IsOptional } from 'class-validator'

export class CreateIdeaDto {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsNotEmpty()
  explanation: string

  @IsString()
  @IsOptional()
  clientId?: string
}
