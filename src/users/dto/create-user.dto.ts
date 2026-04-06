import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator'

export class CreateUserDto {
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  email: string

  @IsString()
  @IsOptional()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password?: string

  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  displayName: string

  @IsEnum(['admin', 'client'], { message: 'El rol debe ser admin o client' })
  @IsOptional()
  role?: 'admin' | 'client'
}
