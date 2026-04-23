import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class ConsultaDto {
  @IsOptional()
  @IsString()
  asunto?: string

  @IsNotEmpty()
  @IsString()
  contenido: string
}
