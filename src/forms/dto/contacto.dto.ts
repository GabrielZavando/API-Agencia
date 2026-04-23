import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class ContactoDto {
  @IsNotEmpty()
  @IsString()
  nombre: string

  @IsNotEmpty()
  @IsEmail()
  email: string

  @IsOptional()
  @IsString()
  empresa?: string

  @IsOptional()
  @IsString()
  industria?: string

  @IsOptional()
  @IsString()
  telefono?: string

  @IsNotEmpty()
  @IsString()
  origen: 'formulario_contacto' | 'formulario_diagnostico' | 'chatbot'
}
